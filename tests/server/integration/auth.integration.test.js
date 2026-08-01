import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from '../../../server/config/db.js';
import app from '../../../server/app.js';

let server;
let baseUrl;

beforeAll(async () => {
  const uri = 'mongodb://127.0.0.1:27017/shelfwise_test';
  await mongoose.connect(uri);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (server) {
    server.close();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Auth Integration', () => {
  const validUser = {
    name: 'Integration Test',
    email: 'integration@test.com',
    password: 'password123',
  };

  it('should register a new user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser)
    });
    const body = await res.json();
      
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.name).toBe(validUser.name);
    expect(body.data.user.email).toBe(validUser.email);
  });

  it('should login an existing user and return tokens', async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser)
    });

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validUser.email, password: validUser.password })
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.accessToken).toBeDefined();
    
    // Check if refresh cookie is set
    const cookies = res.headers.get('set-cookie');
    expect(cookies).toBeDefined();
    expect(cookies.includes('sw_refresh')).toBe(true);
  });

  it('should retrieve user profile with valid access token', async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser)
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validUser.email, password: validUser.password })
    });
    const loginBody = await loginRes.json();
    const accessToken = loginBody.data.accessToken;

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const meBody = await meRes.json();

    expect(meRes.status).toBe(200);
    expect(meBody.data.user.email).toBe(validUser.email);
  });
  
  it('should forbid access without token', async () => {
    const meRes = await fetch(`${baseUrl}/api/auth/me`);
    expect(meRes.status).toBe(401);
  });
});
