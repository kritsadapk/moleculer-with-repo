import { ServiceBroker } from 'moleculer';
import { OrderRepository } from '../repositories/order.repository';
import { OrderEntity } from '../models/order.entity';
import type { Order } from '../repositories/interfaces/order.repository.interface';

jest.mock('../models/order.entity');

describe('Order Repository', () => {
  let broker: ServiceBroker;
  let repository: OrderRepository;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
    repository = new OrderRepository(broker);
    return broker.start();
  });

  afterEach(() => {
    jest.clearAllMocks();
    return broker.stop();
  });

  describe('findByUserId', () => {
    it('should find orders by user ID', async () => {
      const mockOrders = [
        { _id: '1', userId: 'user123', status: 'pending' },
        { _id: '2', userId: 'user123', status: 'completed' }
      ];

      (OrderEntity.find as jest.Mock).mockResolvedValue(mockOrders);

      const result = await repository.findByUserId('user123');

      expect(result).toEqual(mockOrders);
      expect(OrderEntity.find).toHaveBeenCalledWith({ userId: 'user123' });
    });
  });

  describe('findByStatus', () => {
    it('should find orders by status', async () => {
      const mockOrders = [
        { _id: '1', userId: 'user123', status: 'pending' },
        { _id: '2', userId: 'user456', status: 'pending' }
      ];

      (OrderEntity.find as jest.Mock).mockResolvedValue(mockOrders);

      const result = await repository.findByStatus('pending');

      expect(result).toEqual(mockOrders);
      expect(OrderEntity.find).toHaveBeenCalledWith({ status: 'pending' });
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = { _id: '1', userId: 'user123', status: 'pending' };
      const updatedOrder = { ...mockOrder, status: 'processing' };

      (OrderEntity.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedOrder);

      const result = await repository.updateStatus('1', 'processing');

      expect(result).toEqual(updatedOrder);
      expect(OrderEntity.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { status: 'processing' },
        { new: true }
      );
    });
  });

  describe('getOrderWithUser', () => {
    it('should get order with user information', async () => {
      const mockOrder = { _id: '1', userId: 'user123', status: 'pending' };
      const mockUser = { _id: 'user123', name: 'Test User' };

      (OrderEntity.findById as jest.Mock).mockResolvedValue(mockOrder);
      (broker.call as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.getOrderWithUser('1');

      expect(result).toEqual({
        ...mockOrder,
        user: mockUser
      });
      expect(OrderEntity.findById).toHaveBeenCalledWith('1');
      expect(broker.call).toHaveBeenCalledWith('user.get', { id: 'user123' });
    });

    it('should return null if order not found', async () => {
      (OrderEntity.findById as jest.Mock).mockResolvedValue(null);

      const result = await repository.getOrderWithUser('1');

      expect(result).toBeNull();
      expect(OrderEntity.findById).toHaveBeenCalledWith('1');
      expect(broker.call).not.toHaveBeenCalled();
    });
  });
}); 