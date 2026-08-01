import User from '../models/user.model.js';

class UserRepository {
  create(data) {
    return User.create(data);
  }

  findById(id) {
    return User.findById(id);
  }

  findByIdWithPassword(id) {
    return User.findById(id).select('+passwordHash');
  }

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  incrementRefreshVersion(id) {
    return User.findByIdAndUpdate(
      id,
      { $inc: { refreshTokenVersion: 1 } },
      { new: true }
    );
  }

  list({ role, isActive, q, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    return Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }
}

export default UserRepository;
