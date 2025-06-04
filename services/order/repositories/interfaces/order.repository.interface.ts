import { BaseRepositoryInterface } from '../../user/repositories/interfaces/base.repository.interface';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithUser extends Order {
  user: {
    _id: string;
    name: string;
    email: string;
    // ... other user fields
  };
}

export interface OrderRepositoryInterface extends BaseRepositoryInterface<Order> {
  findByUserId(userId: string): Promise<Order[]>;
  findByStatus(status: Order['status']): Promise<Order[]>;
  updateStatus(id: string, status: Order['status']): Promise<Order | null>;
  getOrderWithUser(orderId: string): Promise<OrderWithUser | null>;
} 