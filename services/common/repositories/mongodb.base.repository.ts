import type { Model } from 'mongoose';
import type { BaseRepositoryInterface } from '../../user/repositories/interfaces/base.repository.interface';

export abstract class MongoBaseRepository<T> implements BaseRepositoryInterface<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    return this.model.findOne(query);
  }

  async find(query: Record<string, unknown>): Promise<T[]> {
    return this.model.find(query);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id);
  }
} 