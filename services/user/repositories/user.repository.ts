import { BaseRepository } from './base.repository';
import type { User, UserRepositoryInterface } from './interfaces/user.repository.interface';
import { UserModel } from '../models/user.model';

export class UserRepository extends BaseRepository<User> implements UserRepositoryInterface {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }
} 