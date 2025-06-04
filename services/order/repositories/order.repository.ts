import { DataSource } from 'typeorm';
import { OrderEntity } from '../models/order.entity';
import type { Order, OrderRepositoryInterface, OrderWithUser } from './interfaces/order.repository.interface';
import { PostgresBaseRepository } from '../../common/repositories/postgres.base.repository';
import type { ServiceBroker } from 'moleculer';
import { Cache } from '../../common/decorators/cache.decorator';

export class OrderRepository extends PostgresBaseRepository<Order> implements OrderRepositoryInterface {
  private broker: ServiceBroker;

  constructor(broker: ServiceBroker, dataSource: DataSource) {
    super(dataSource, OrderEntity);
    this.broker = broker;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.find({ userId });
  }

  async findByStatus(status: Order['status']): Promise<Order[]> {
    return this.find({ status });
  }

  async updateStatus(id: string, status: Order['status']): Promise<Order | null> {
    return this.update(id, { status });
  }

  @Cache({
    ttl: 30,
    key: (id: string) => `order:with:user:${id}`
  })
  async getOrderWithUser(orderId: string): Promise<OrderWithUser | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    // เรียกใช้ user service ผ่าน broker
    const user = await this.broker.call('user.get', { id: order.userId });
    
    return {
      ...order,
      user
    };
  }
} 