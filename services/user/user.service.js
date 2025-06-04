const { ServiceBroker } = require("moleculer");
const UserRepository = require("./repositories/user.repository");

module.exports = {
  name: "user",
  version: 1,

  settings: {
    db: {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/moleculer-with-repo"
    }
  },

  dependencies: [],

  actions: {
    create: {
      params: {
        email: "string",
        name: "string",
        password: "string"
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.create(ctx.params);
      }
    },

    get: {
      params: {
        id: "string"
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.findById(ctx.params.id);
      }
    },

    findByEmail: {
      params: {
        email: "string"
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.findByEmail(ctx.params.email);
      }
    },

    update: {
      params: {
        id: "string",
        name: { type: "string", optional: true },
        email: { type: "string", optional: true }
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.update(ctx.params.id, ctx.params);
      }
    },

    delete: {
      params: {
        id: "string"
      },
      async handler(ctx) {
        const userRepo = new UserRepository();
        return userRepo.delete(ctx.params.id);
      }
    }
  },

  events: {},

  methods: {},

  async started() {
    // Connect to MongoDB
    const mongoose = require("mongoose");
    await mongoose.connect(this.settings.db.uri);
    this.logger.info("Connected to MongoDB");
  },

  async stopped() {
    // Disconnect from MongoDB
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    this.logger.info("Disconnected from MongoDB");
  }
}; 