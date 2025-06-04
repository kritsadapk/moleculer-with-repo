import { BaseRepositoryInterface } from './base.repository.interface';

export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
  findByEmail(email: string): Promise<User | null>;
} 