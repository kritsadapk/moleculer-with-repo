import { MongoBaseRepository } from '../../common/repositories/mongodb.base.repository';
import type { Product, ProductRepositoryInterface, ProductPriceInfo, ProductWithAccount } from './interfaces/product.repository.interface';
import { ProductModel } from '../models/product.model';
import type { ServiceBroker } from 'moleculer';
import { Cache } from '../../common/decorators/cache.decorator';

export class ProductRepository extends MongoBaseRepository<Product> implements ProductRepositoryInterface {
  private broker: ServiceBroker;

  constructor(broker: ServiceBroker) {
    super(ProductModel);
    this.broker = broker;
  }

  @Cache({
    ttl: 60,
    key: (name: string) => `product:price:${name}`
  })
  async findPriceByName(name: string): Promise<ProductPriceInfo | null> {
    const product = await this.findOne({ name: { $regex: name, $options: 'i' } });
    
    if (!product) return null;
    
    return {
      _id: product._id.toString(),
      name: product.name,
      price: product.price
    };
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.find({ category });
  }

  async findByName(name: string): Promise<Product[]> {
    return this.find({ name: { $regex: name, $options: 'i' } });
  }

  async updateStock(id: string, quantity: number): Promise<Product | null> {
    return this.update(id, { $inc: { stock: quantity } });
  }

  async getProductWithAccount(productId: string): Promise<ProductWithAccount | null> {
    const product = await this.findById(productId);
    if (!product) return null;

    // เรียกใช้ account service ผ่าน broker
    const account = await this.broker.call('account.get', { id: product.accountId });
    
    return {
      ...product,
      account
    };
  }
} 