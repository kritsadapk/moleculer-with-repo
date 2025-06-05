import { Model, Document } from 'mongoose';
import { BaseRepositoryInterface } from '../../user/repositories/interfaces/base.repository.interface';
import { PaginationOptions, PaginatedResult, CursorPaginationOptions, CursorPaginatedResult } from '../interfaces/pagination.interface';

export abstract class MongoBaseRepository<T extends Document> implements BaseRepositoryInterface<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async find(filter: Partial<T>): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  // Pagination methods
  async findWithPagination(
    filter: Partial<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 }
    } = options;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .lean()
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage
    };
  }

  async findWithCursor(
    filter: Partial<T> = {},
    options: CursorPaginationOptions = {}
  ): Promise<CursorPaginatedResult<T>> {
    const {
      limit = 10,
      sort = { _id: 1 },
      lastId
    } = options;

    const query = { ...filter };
    if (lastId) {
      query._id = { $gt: lastId };
    }

    const items = await this.model
      .find(query)
      .sort(sort)
      .limit(limit + 1)
      .exec();

    const hasMore = items.length > limit;
    const result = hasMore ? items.slice(0, -1) : items;
    const newLastId = result.length > 0 ? result[result.length - 1]._id : undefined;

    return {
      items: result,
      lastId: newLastId,
      hasMore
    };
  }

  async findWithSearch(
    searchQuery: string,
    searchFields: (keyof T)[],
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 }
    } = options;

    const skip = (page - 1) * limit;

    // สร้าง search query สำหรับทุก field
    const searchFilter = {
      $or: searchFields.map(field => ({
        [field]: { $regex: searchQuery, $options: 'i' }
      }))
    };

    const [items, total] = await Promise.all([
      this.model
        .find(searchFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(searchFilter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage
    };
  }
} 