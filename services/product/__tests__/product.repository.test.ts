import { ServiceBroker } from 'moleculer';
import { ProductRepository } from '../repositories/product.repository';
import { ProductModel } from '../models/product.model';
import type { Product } from '../repositories/interfaces/product.repository.interface';

jest.mock('../models/product.model');

describe('Product Repository', () => {
  let broker: ServiceBroker;
  let repository: ProductRepository;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
    repository = new ProductRepository(broker);
    return broker.start();
  });

  afterEach(() => {
    jest.clearAllMocks();
    return broker.stop();
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'Electronics' },
        { _id: '2', name: 'Product 2', category: 'Electronics' }
      ];

      (ProductModel.find as jest.Mock).mockResolvedValue(mockProducts);

      const result = await repository.findByCategory('Electronics');

      expect(result).toEqual(mockProducts);
      expect(ProductModel.find).toHaveBeenCalledWith({ category: 'Electronics' });
    });
  });

  describe('findByName', () => {
    it('should find products by name', async () => {
      const mockProducts = [
        { _id: '1', name: 'iPhone', category: 'Electronics' }
      ];

      (ProductModel.find as jest.Mock).mockResolvedValue(mockProducts);

      const result = await repository.findByName('iPhone');

      expect(result).toEqual(mockProducts);
      expect(ProductModel.find).toHaveBeenCalledWith({ name: { $regex: 'iPhone', $options: 'i' } });
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const mockProduct = { _id: '1', name: 'Product 1', stock: 10 };
      const updatedProduct = { ...mockProduct, stock: 5 };

      (ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedProduct);

      const result = await repository.updateStock('1', 5);

      expect(result).toEqual(updatedProduct);
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { $set: { stock: 5 } },
        { new: true }
      );
    });
  });

  describe('getProductWithAccount', () => {
    it('should get product with account information', async () => {
      const mockProduct = { _id: '1', name: 'Product 1', accountId: 'acc123' };
      const mockAccount = { _id: 'acc123', name: 'Test Account' };

      (ProductModel.findById as jest.Mock).mockResolvedValue(mockProduct);
      (broker.call as jest.Mock).mockResolvedValue(mockAccount);

      const result = await repository.getProductWithAccount('1');

      expect(result).toEqual({
        ...mockProduct,
        account: mockAccount
      });
      expect(ProductModel.findById).toHaveBeenCalledWith('1');
      expect(broker.call).toHaveBeenCalledWith('account.get', { id: 'acc123' });
    });

    it('should return null if product not found', async () => {
      (ProductModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await repository.getProductWithAccount('1');

      expect(result).toBeNull();
      expect(ProductModel.findById).toHaveBeenCalledWith('1');
      expect(broker.call).not.toHaveBeenCalled();
    });
  });
}); 