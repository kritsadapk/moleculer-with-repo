import { MongoBaseRepository } from '../../common/repositories/mongodb.base.repository';
import type { Product, ProductRepositoryInterface, ProductPriceInfo, ProductWithAccount } from './interfaces/product.repository.interface';
import { ProductModel } from '../models/product.model';
import type { ServiceBroker } from 'moleculer';
import { Cache } from '../../common/decorators/cache.decorator';
import type { PipelineStage } from 'mongoose';

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

  async updateStock(id: string, stock: number): Promise<Product | null> {
    return this.update(id, { stock });
  }

  @Cache({
    ttl: 30,
    key: (id: string) => `product:with:account:${id}`
  })
  async getProductWithAccount(productId: string): Promise<ProductWithAccount | null> {
    const product = await this.findById(productId);
    if (!product) return null;

    const account = await this.broker.call('account.get', { id: product.accountId });
    return {
      ...product,
      account: account as ProductWithAccount['account']
    };
  }

  async getTopSellingProducts(limit: number = 10): Promise<Array<Product & { totalSales: number }>> {
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.productId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalSales: {
            $reduce: {
              input: '$orders',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $reduce: {
                      input: '$$this.items',
                      initialValue: 0,
                      in: {
                        $cond: {
                          if: { $eq: ['$$this.productId', '$_id'] },
                          then: { $multiply: ['$$this.quantity', '$$this.price'] },
                          else: '$$value'
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: limit
      }
    ];

    return this.model.aggregate(pipeline).exec();
  }

  async getSalesByCategory(): Promise<Array<{ category: string; totalSales: number; productCount: number }>> {
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.productId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalSales: {
            $reduce: {
              input: '$orders',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $reduce: {
                      input: '$$this.items',
                      initialValue: 0,
                      in: {
                        $cond: {
                          if: { $eq: ['$$this.productId', '$_id'] },
                          then: { $multiply: ['$$this.quantity', '$$this.price'] },
                          else: '$$value'
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSales: { $sum: '$totalSales' },
          productCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalSales: 1,
          productCount: 1
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ];

    return this.model.aggregate(pipeline).exec();
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          stock: { $lt: threshold }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.productId',
          as: 'recentOrders'
        }
      },
      {
        $addFields: {
          recentOrders: {
            $filter: {
              input: '$recentOrders',
              as: 'order',
              cond: {
                $gte: [
                  '$$order.createdAt',
                  { $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          salesFrequency: { $size: '$recentOrders' }
        }
      },
      {
        $sort: { salesFrequency: -1 }
      }
    ];

    return this.model.aggregate(pipeline).exec();
  }
} 