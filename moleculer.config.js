module.exports = {
  namespace: "moleculer-with-repo",
  nodeID: "node-1",
  logger: true,
  logLevel: "info",
  transporter: {
    type: "NATS",
    options: {
      url: process.env.NATS_URL || "nats://localhost:4222"
    }
  },
  metrics: true,
  tracing: {
    enabled: true,
    exporter: {
      type: "Console",
      options: {
        width: 100,
        colors: true
      }
    }
  }
}; 