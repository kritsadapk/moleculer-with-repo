import { Schema, model, Document } from 'mongoose';
import { User } from '../repositories/interfaces/user.repository.interface';

const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const UserModel = model<User>('User', userSchema); 