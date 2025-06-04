import { ServiceBroker } from 'moleculer';
import { OrderService } from '../order.service';
import { OrderRepository } from '../repositories/order.repository';
import type { Order, OrderItem } from '../repositories/interfaces/order.repository.interface';

describe('Order Service', () => {
  let broker: ServiceBroker;
  let service: OrderService;
  let repository: OrderRepository;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
    repository = new OrderRepository(broker);
    service = new OrderService(broker, repository);
    broker.createService(service);
    return broker.start();
  });

  afterEach(() => {
    return broker.stop();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const orderData = {
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 2,
            price: 100
          }
        ]
      };

      const result = await broker.call('order.create', orderData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(orderData.userId);
      expect(result.items).toHaveLength(1);
      expect(result.totalAmount).toBe(200); // 2 * 100
      expect(result.status).toBe('pending');
    });

    it('should throw error if items array is empty', async () => {
      const orderData = {
        userId: 'user123',
        items: []
      };

      await expect(broker.call('order.create', orderData))
        .rejects
        .toThrow('Order must have at least one item');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const orderData = {
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 1,
            price: 100
          }
        ]
      };

      const order = await broker.call('order.create', orderData);
      const result = await broker.call('order.updateStatus', {
        id: order._id,
        status: 'processing'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('processing');
    });

    it('should throw error if status is invalid', async () => {
      const orderData = {
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 1,
            price: 100
          }
        ]
      };

      const order = await broker.call('order.create', orderData);

      await expect(broker.call('order.updateStatus', {
        id: order._id,
        status: 'invalid_status'
      }))
        .rejects
        .toThrow('Invalid status');
    });
  });

  describe('findByUserId', () => {
    it('should find orders by user ID', async () => {
      const orderData = {
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 1,
            price: 100
          }
        ]
      };

      await broker.call('order.create', orderData);
      const result = await broker.call('order.findByUserId', { userId: 'user123' });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].userId).toBe('user123');
    });
  });

  describe('getWithUser', () => {
    it('should get order with user information', async () => {
      const orderData = {
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 1,
            price: 100
          }
        ]
      };

      const order = await broker.call('order.create', orderData);
      const result = await broker.call('order.getWithUser', { id: order._id });

      expect(result).toBeDefined();
      expect(result.userId).toBe(orderData.userId);
      expect(result.user).toBeDefined();
    });
  });
}); 