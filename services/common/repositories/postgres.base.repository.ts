import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { BaseRepositoryInterface } from '../../user/repositories/interfaces/base.repository.interface';
import { PaginationOptions, PaginatedResult, CursorPaginationOptions, CursorPaginatedResult } from '../interfaces/pagination.interface';

export abstract class PostgresBaseRepository<T> implements BaseRepositoryInterface<T> {
  protected repository: Repository<T>;

  constructor(dataSource: DataSource, entity: new () => T) {
    this.repository = dataSource.getRepository(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.repository.findOneBy(filter as FindOptionsWhere<T>);
  }

  async find(filter: Partial<T>): Promise<T[]> {
    return this.repository.findBy(filter as FindOptionsWhere<T>);
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

  // Pagination methods
  async findWithPagination(
    filter: Partial<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: 'DESC' }
    } = options;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.find({
        where: filter as FindOptionsWhere<T>,
        skip,
        take: limit,
        order: sort
      }),
      this.repository.count({
        where: filter as FindOptionsWhere<T>
      })
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
      sort = { id: 'ASC' },
      lastId
    } = options;

    const queryBuilder = this.repository.createQueryBuilder('entity');

    // เพิ่ม filter
    for (const [key, value] of Object.entries(filter)) {
      queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
    }

    // เพิ่ม cursor condition
    if (lastId) {
      queryBuilder.andWhere('entity.id > :lastId', { lastId });
    }

    // เพิ่ม sort
    for (const [key, value] of Object.entries(sort)) {
      queryBuilder.addOrderBy(`entity.${key}`, value as 'ASC' | 'DESC');
    }

    // เพิ่ม limit + 1 เพื่อตรวจสอบว่ามีข้อมูลมากกว่าหรือไม่
    queryBuilder.take(limit + 1);

    const items = await queryBuilder.getMany();
    const hasMore = items.length > limit;
    const result = hasMore ? items.slice(0, -1) : items;
    const newLastId = result.length > 0 ? (result[result.length - 1] as { id: string }).id : undefined;

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
      sort = { createdAt: 'DESC' }
    } = options;

    const skip = (page - 1) * limit;

    // สร้าง query builder
    const queryBuilder = this.repository.createQueryBuilder('entity');

    // เพิ่ม search conditions
    searchFields.forEach((field, index) => {
      const paramName = `search${index}`;
      queryBuilder.orWhere(`entity.${String(field)} ILIKE :${paramName}`, {
        [paramName]: `%${searchQuery}%`
      });
    });

    // เพิ่ม sort
    for (const [key, value] of Object.entries(sort)) {
      queryBuilder.addOrderBy(`entity.${key}`, value as 'ASC' | 'DESC');
    }

    // เพิ่ม pagination
    queryBuilder.skip(skip).take(limit);

    // ดึงข้อมูลและนับจำนวน
    const [items, total] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.getCount()
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