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

  // คำนวณยอดขายรวมตามช่วงเวลา
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Array<{ date: string; totalSales: number; orderCount: number }>> {
    const query = this.repository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.total)', 'totalSales')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: 'completed' })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC');

    return query.getRawMany();
  }

  // คำนวณยอดขายรวมตามสินค้า
  async getSalesByProduct(): Promise<Array<{ productId: string; productName: string; totalQuantity: number; totalSales: number }>> {
    const query = this.repository
      .createQueryBuilder('order')
      .select('item.productId', 'productId')
      .addSelect('item.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.quantity * item.price)', 'totalSales')
      .innerJoin('order.items', 'item')
      .where('order.status = :status', { status: 'completed' })
      .groupBy('item.productId')
      .addGroupBy('item.name')
      .orderBy('totalSales', 'DESC');

    return query.getRawMany();
  }

  // คำนวณยอดขายรวมตามผู้ใช้
  async getSalesByUser(): Promise<Array<{ userId: string; userName: string; totalOrders: number; totalSales: number }>> {
    const query = this.repository
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.total)', 'totalSales')
      .innerJoin('user', 'user', 'user.id = order.userId')
      .where('order.status = :status', { status: 'completed' })
      .groupBy('order.userId')
      .addGroupBy('user.name')
      .orderBy('totalSales', 'DESC');

    return query.getRawMany();
  }

  // คำนวณสถิติการชำระเงิน
  async getPaymentStatistics(): Promise<Array<{ paymentMethod: string; totalOrders: number; totalAmount: number }>> {
    const query = this.repository
      .createQueryBuilder('order')
      .select('order.paymentMethod', 'paymentMethod')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.total)', 'totalAmount')
      .where('order.status = :status', { status: 'completed' })
      .groupBy('order.paymentMethod')
      .orderBy('totalAmount', 'DESC');

    return query.getRawMany();
  }
} 