import { Repository, DataSource } from 'typeorm';
import { BaseRepositoryInterface } from '../../user/repositories/interfaces/base.repository.interface';

export abstract class PostgresBaseRepository<T> implements BaseRepositoryInterface<T> {
  protected repository: Repository<T>;

  constructor(dataSource: DataSource, entity: new () => T) {
    this.repository = dataSource.getRepository(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ _id: id } as any);
  }

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    return this.repository.findOneBy(query as any);
  }

  async find(query: Record<string, unknown>): Promise<T[]> {
    return this.repository.findBy(query as any);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<T | null> {
    const entity = await this.findById(id);
    if (entity) {
      await this.repository.delete(id);
    }
    return entity;
  }
} 