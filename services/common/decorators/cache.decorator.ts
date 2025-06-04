import type { ServiceBroker } from 'moleculer';

interface CacheOptions {
  ttl?: number;
  key?: string | ((...args: any[]) => string);
}

export function Cache(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const ttl = options.ttl || 60; // default 60 seconds

    descriptor.value = async function (...args: any[]) {
      const broker = (this as any).broker as ServiceBroker;
      if (!broker?.cacher) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = typeof options.key === 'function' 
        ? options.key(...args)
        : options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await broker.cacher.get(cacheKey);
      if (cached) {
        return cached;
      }

      // If not in cache, execute original method
      const result = await originalMethod.apply(this, args);

      // Save to cache
      if (result !== null && result !== undefined) {
        await broker.cacher.set(cacheKey, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
} 