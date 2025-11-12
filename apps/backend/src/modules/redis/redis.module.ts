// src/modules/redis/redis.module.ts
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const enabled = configService.get<string>('REDIS_ENABLED', 'true') !== 'false';

        if (!enabled) {
          logger.warn('REDIS_ENABLED=false，使用内存缓存代替 Redis');
          return null;
        }

        const options: RedisOptions = {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: Number(configService.get<string>('REDIS_PORT', '6379')),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(configService.get<string>('REDIS_DB', '0')),
          keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'nestbase:'),
          lazyConnect: true,
        };

        const client = new Redis(options);

        client.on('connect', () => logger.log('Redis 已连接'));
        client.on('error', (error) => logger.error('Redis 连接异常', error));
        client.on('reconnecting', () => logger.warn('Redis 正在重连...'));

        try {
          await client.connect();
          return client;
        } catch (error) {
          const err = error as Error;
          logger.error(`Redis 初始化连接失败，将退回内存缓存: ${err.message}`);
          client.disconnect();
          return null;
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
