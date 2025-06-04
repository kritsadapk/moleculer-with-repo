import { Service, Context } from 'moleculer';
import { User } from './repositories/interfaces/user.repository.interface';
import { UserRepository } from './repositories/user.repository';

interface UserServiceSettings {
  db: {
    uri: string;
  };
}

interface UserServiceDependencies {}

interface UserServiceActions {
  create: {
    params: {
      email: string;
      name: string;
      password: string;
    };
    handler: (ctx: Context) => Promise<User>;
  };
  get: {
    params: {
      id: string;
    };
    handler: (ctx: Context) => Promise<User | null>;
  };
  findByEmail: {
    params: {
      email: string;
    };
    handler: (ctx: Context) => Promise<User | null>;
  };
  update: {
    params: {
      id: string;
      name?: string;
      email?: string;
    };
    handler: (ctx: Context) => Promise<User | null>;
  };
  delete: {
    params: {
      id: string;
    };
    handler: (ctx: Context) => Promise<User | null>;
  };
}

export default class UserService extends Service<UserServiceSettings, UserServiceDependencies, UserServiceActions> {
  name = 'user';
  version = 1;

  settings: UserServiceSettings = {
    db: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/moleculer-with-repo'
    }
  };

  dependencies: UserServiceDependencies = {};

  actions: UserServiceActions = {
    create: {
      params: {
        email: 'string',
        name: 'string',
        password: 'string'
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.create(ctx.params);
      }
    },

    get: {
      params: {
        id: 'string'
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.findById(ctx.params.id);
      }
    },

    findByEmail: {
      params: {
        email: 'string'
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.findByEmail(ctx.params.email);
      }
    },

    update: {
      params: {
        id: 'string',
        name: { type: 'string', optional: true },
        email: { type: 'string', optional: true }
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.update(ctx.params.id, ctx.params);
      }
    },

    delete: {
      params: {
        id: 'string'
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.delete(ctx.params.id);
      }
    }
  };

  async started() {
    const mongoose = require('mongoose');
    await mongoose.connect(this.settings.db.uri);
    this.logger.info('Connected to MongoDB');
  }

  async stopped() {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    this.logger.info('Disconnected from MongoDB');
  }
} 