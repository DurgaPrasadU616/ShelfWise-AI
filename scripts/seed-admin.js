import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '../server');

const require = createRequire(path.join(serverDir, 'package.json'));
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const loadEnv = (file) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2];
      }
    }
  } catch (_err) {
    /* ignore missing file */
  }
};

loadEnv(path.join(serverDir, '.env'));

const usage = `Usage:
  node scripts/seed-admin.js --email admin@shelfwise.app --password 'change-me' [--name 'Admin']
  (or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME env vars)`;

const args = process.argv.slice(2);
const flag = (key) => {
  const idx = args.indexOf(key);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const email = flag('--email') || process.env.SEED_ADMIN_EMAIL;
const password = flag('--password') || process.env.SEED_ADMIN_PASSWORD;
const name = flag('--name') || process.env.SEED_ADMIN_NAME || 'Admin';

if (!email || !password) {
  console.error('Missing email/password.');
  console.log(usage);
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfwise';

const run = async () => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const existing = await mongoose.connection.collection('users').findOne({
    email: email.toLowerCase(),
  });
  if (existing) {
    await mongoose.connection.collection('users').updateOne(
      { _id: existing._id },
      { $set: { role: 'admin', isActive: true } }
    );
    console.log(`[seed] Admin already exists for ${email}, role set to admin`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await mongoose.connection.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true,
      refreshTokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[seed] Seeded admin user ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('[seed] Failed:', error.message);
  process.exit(1);
});
