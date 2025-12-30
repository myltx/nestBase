// src/modules/redis/redis.service.ts
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly useFallback: boolean;
  private readonly fallbackStore = new Map<
    string,
    {
      value: string;
      expireAt?: number;
    }
  >();

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {
    this.useFallback = !client;

    if (this.useFallback) {
      this.logger.warn('Redis 未启用或连接失败，回退到进程内缓存（仅适合开发环境）');
    } else {
      this.logger.log('Redis 客户端已启用');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useFallback) {
      const entry = this.fallbackStore.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expireAt && entry.expireAt <= Date.now()) {
        this.fallbackStore.delete(key);
        return null;
      }
      return entry.value;
    }

    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (this.useFallback) {
      const expireAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
      this.fallbackStore.set(key, { value, expireAt });
      return;
    }

    if (ttlSeconds && ttlSeconds > 0) {
      await this.client!.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client!.set(key, value);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`解析 Redis JSON 失败: ${error}`);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number) {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(...keys: string[]) {
    if (keys.length === 0) {
      return;
    }
    if (this.useFallback) {
      keys.forEach((key) => this.fallbackStore.delete(key));
      return;
    }
    await this.client!.del(...keys);
  }

  async ttl(key: string): Promise<number> {
    if (this.useFallback) {
      const entry = this.fallbackStore.get(key);
      if (!entry) {
        return -2; // key 不存在
      }
      if (!entry.expireAt) {
        return -1; // 无过期时间
      }
      const ttlMs = entry.expireAt - Date.now();
      if (ttlMs <= 0) {
        this.fallbackStore.delete(key);
        return -2;
      }
      return Math.ceil(ttlMs / 1000);
    }

    return this.client!.ttl(key);
  }
}
