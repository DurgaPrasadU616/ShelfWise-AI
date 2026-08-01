import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user.repository.js';
import AppError from '../utils/AppError.js';

const BCRYPT_ROUNDS = 10;

class UserService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  list(filters) {
    return this.userRepository.list(filters);
  }

  async create({ name, email, password, role }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('DUPLICATE_EMAIL', 'Email is already registered', 409);
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create({ name, email, passwordHash, role });
    return { user };
  }

  async update(id, { role, isActive }) {
    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await this.userRepository.updateById(id, update);
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }
    return { user };
  }

  async softDelete(id) {
    const user = await this.userRepository.updateById(id, { isActive: false });
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }
    return { user };
  }
}

export default UserService;
