export interface BaseRepositoryInterface<T> {
  findById(id: string): Promise<T | null>;
  findOne(query: Record<string, any>): Promise<T | null>;
  find(query: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
} 