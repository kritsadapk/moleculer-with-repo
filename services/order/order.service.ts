import { Service, Context } from 'moleculer';
import { DataSource } from 'typeorm';
import { OrderEntity } from './models/order.entity';
import { Order, OrderItem } from './repositories/interfaces/order.repository.interface';
import { OrderRepository } from './repositories/order.repository';

interface OrderServiceSettings {
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

interface OrderServiceDependencies {
  product: string;
}

interface OrderServiceActions {
  create: {
    params: {
      userId: string;
      items: OrderItem[];
    };
    handler: (ctx: Context) => Promise<Order>;
  };
  get: {
    params: {
      id: string;
    };
    handler: (ctx: Context) => Promise<Order | null>;
  };
  findByUserId: {
    params: {
      userId: string;
    };
    handler: (ctx: Context) => Promise<Order[]>;
  };
  findByStatus: {
    params: {
      status: Order['status'];
    };
    handler: (ctx: Context) => Promise<Order[]>;
  };
  updateStatus: {
    params: {
      id: string;
      status: Order['status'];
    };
    handler: (ctx: Context) => Promise<Order | null>;
  };
  delete: {
    params: {
      id: string;
    };
    handler: (ctx: Context) => Promise<Order | null>;
  };
}

export default class OrderService extends Service<OrderServiceSettings, OrderServiceDependencies, OrderServiceActions> {
  name = 'order';
  version = 1;
  private dataSource: DataSource;
  private orderRepository: OrderRepository;

  settings: OrderServiceSettings = {
    db: {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: process.env.PG_DATABASE || 'moleculer_with_repo'
    }
  };

  dependencies: OrderServiceDependencies = {
    product: 'product'
  };

  actions: OrderServiceActions = {
    create: {
      params: {
        userId: 'string',
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              productId: 'string',
              quantity: 'number',
              price: 'number'
            }
          }
        }
      },
      async handler(ctx) {
        // Calculate total amount
        const totalAmount = ctx.params.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Create order
        const order = await this.orderRepository.create({
          ...ctx.params,
          totalAmount,
          status: 'pending'
        });

        // Update product stock
        for (const item of ctx.params.items) {
          await ctx.call('product.updateStock', {
            id: item.productId,
            quantity: -item.quantity
          });
        }

        return order;
      }
    },

    get: {
      params: {
        id: 'string'
      },
      async handler(ctx) {
        return this.orderRepository.findById(ctx.params.id);
      }
    },

    findByUserId: {
      params: {
        userId: 'string'
      },
      async handler(ctx) {
        return this.orderRepository.findByUserId(ctx.params.userId);
      }
    },

    findByStatus: {
      params: {
        status: 'string'
      },
      async handler(ctx) {
        return this.orderRepository.findByStatus(ctx.params.status as Order['status']);
      }
    },

    updateStatus: {
      params: {
        id: 'string',
        status: 'string'
      },
      async handler(ctx) {
        return this.orderRepository.updateStatus(
          ctx.params.id,
          ctx.params.status as Order['status']
        );
      }
    },

    delete: {
      params: {
        id: 'string'
      },
      async handler(ctx) {
        return this.orderRepository.delete(ctx.params.id);
      }
    }
  };

  async started() {
    // Initialize TypeORM
    this.dataSource = new DataSource({
      type: 'postgres',
      ...this.settings.db,
      entities: [OrderEntity],
      synchronize: true
    });

    await this.dataSource.initialize();
    this.logger.info('Connected to PostgreSQL');

    // Initialize repository
    this.orderRepository = new OrderRepository(this.dataSource);
  }

  async stopped() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.info('Disconnected from PostgreSQL');
    }
  }
} 