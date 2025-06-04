import { Service, Context } from 'moleculer';
import { ProductRepository } from './repositories/product.repository';
import type { Product, ProductPriceInfo, ProductWithAccount } from './repositories/interfaces/product.repository.interface';

interface ServiceSchema {
  name: string;
  settings: {
    mongodb: {
      uri: string;
      dbName: string;
    };
  };
  actions: Record<string, any>;
  created: () => Promise<void>;
}

export default class ProductService extends Service {
  private repository!: ProductRepository;

  constructor(broker: any) {
    super(broker);

    this.parseServiceSchema({
      name: 'product',
      settings: {
        mongodb: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
          dbName: process.env.MONGODB_DB || 'moleculer-demo',
        },
      },
      actions: {
        create: {
          params: {
            name: 'string',
            description: 'string',
            price: 'number',
            category: 'string',
            stock: { type: 'number', default: 0 },
          },
          handler: this.create,
        },
        get: {
          params: {
            id: 'string',
          },
          handler: this.get,
        },
        find: {
          params: {
            category: { type: 'string', optional: true },
            name: { type: 'string', optional: true },
          },
          handler: this.find,
        },
        findPriceByName: {
          params: {
            name: 'string',
          },
          cache: {
            keys: ['name'],
            ttl: 60 // cache for 60 seconds
          },
          handler: this.findPriceByName,
        },
        update: {
          params: {
            id: 'string',
            name: { type: 'string', optional: true },
            description: { type: 'string', optional: true },
            price: { type: 'number', optional: true },
            category: { type: 'string', optional: true },
            stock: { type: 'number', optional: true },
          },
          handler: this.update,
        },
        delete: {
          params: {
            id: 'string',
          },
          handler: this.delete,
        },
        updateStock: {
          params: {
            id: 'string',
            quantity: 'number',
          },
          handler: this.updateStock,
        },
        getWithAccount: {
          params: {
            id: 'string',
          },
          handler: this.getWithAccount,
        },
      },
      created: this.serviceCreated,
    } as ServiceSchema);
  }

  async serviceCreated() {
    this.repository = new ProductRepository(this.broker);
  }

  async create(ctx: Context<Partial<Product>>): Promise<Product> {
    return this.repository.create(ctx.params);
  }

  async get(ctx: Context<{ id: string }>): Promise<Product | null> {
    return this.repository.findById(ctx.params.id);
  }

  async find(ctx: Context<{ category?: string; name?: string }>): Promise<Product[]> {
    const { category, name } = ctx.params;
    
    if (category) {
      return this.repository.findByCategory(category);
    }
    
    if (name) {
      return this.repository.findByName(name);
    }
    
    return this.repository.find({});
  }

  async findPriceByName(ctx: Context<{ name: string }>): Promise<ProductPriceInfo | null> {
    return this.repository.findPriceByName(ctx.params.name);
  }

  async update(ctx: Context<{ id: string } & Partial<Product>>): Promise<Product | null> {
    const { id, ...data } = ctx.params;
    return this.repository.update(id, data);
  }

  async delete(ctx: Context<{ id: string }>): Promise<Product | null> {
    return this.repository.delete(ctx.params.id);
  }

  async updateStock(ctx: Context<{ id: string; quantity: number }>): Promise<Product | null> {
    return this.repository.updateStock(ctx.params.id, ctx.params.quantity);
  }

  async getWithAccount(ctx: Context<{ id: string }>): Promise<ProductWithAccount | null> {
    return this.repository.getProductWithAccount(ctx.params.id);
  }
} 