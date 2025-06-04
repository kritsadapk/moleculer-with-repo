import { ServiceBroker } from 'moleculer';
import { ProductService } from '../product.service';
import { ProductRepository } from '../repositories/product.repository';
import type { Product } from '../repositories/interfaces/product.repository.interface';

describe('Product Service', () => {
  let broker: ServiceBroker;
  let service: ProductService;
  let repository: ProductRepository;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
    repository = new ProductRepository(broker);
    service = new ProductService(broker, repository);
    broker.createService(service);
    return broker.start();
  });

  afterEach(() => {
    return broker.stop();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        stock: 10
      };

      const result = await broker.call('product.create', productData);

      expect(result).toBeDefined();
      expect(result.name).toBe(productData.name);
      expect(result.price).toBe(productData.price);
      expect(result.stock).toBe(productData.stock);
    });

    it('should throw error if price is negative', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: -100,
        category: 'Test Category',
        stock: 10
      };

      await expect(broker.call('product.create', productData))
        .rejects
        .toThrow('Price must be greater than 0');
    });
  });

  describe('find', () => {
    it('should find products by name', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        stock: 10
      };

      await broker.call('product.create', productData);

      const result = await broker.call('product.find', { name: 'Test Product' });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe(productData.name);
    });
  });

  describe('getWithAccount', () => {
    it('should get product with account information', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        stock: 10
      };

      const product = await broker.call('product.create', productData);

      const result = await broker.call('product.getWithAccount', { id: product._id });

      expect(result).toBeDefined();
      expect(result.name).toBe(productData.name);
      expect(result.account).toBeDefined();
    });
  });
}); 