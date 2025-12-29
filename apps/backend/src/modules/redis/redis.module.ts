// src/modules/redis/redis.module.ts
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
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

        const connectionUrl = configService.get<string>('REDIS_URL');
        const tlsMode = (configService.get<string>('REDIS_TLS', 'auto') || 'auto').toLowerCase();
        const rejectUnauthorized =
          configService.get<string>('REDIS_TLS_REJECT_UNAUTHORIZED', 'true') !== 'false';
        const caFile = configService.get<string>('REDIS_TLS_CA_FILE');
        const commonOptions: RedisOptions = {
          keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'nestbase:'),
          lazyConnect: true,
        };

        const tlsShouldEnable = (url?: string) => {
          if (tlsMode === 'true') return true;
          if (tlsMode === 'false') return false;
          return Boolean(url?.startsWith('rediss://'));
        };

        const buildTlsOptions = (enabled: boolean) => {
          if (!enabled) {
            return undefined;
          }

          const tlsOptions: RedisOptions['tls'] = {
            rejectUnauthorized,
          };

          if (caFile) {
            const filePath = resolve(process.cwd(), caFile);
            if (existsSync(filePath)) {
              tlsOptions.ca = readFileSync(filePath, 'utf8');
            } else {
              logger.warn(`REDIS_TLS_CA_FILE 指定的证书未找到: ${filePath}`);
            }
          }

          return tlsOptions;
        };

        let client: Redis;

        if (connectionUrl) {
          client = new Redis(connectionUrl, {
            ...commonOptions,
            tls: buildTlsOptions(tlsShouldEnable(connectionUrl)),
          });
        } else {
          const host = configService.get<string>('REDIS_HOST', '127.0.0.1');
          const port = Number(configService.get<string>('REDIS_PORT', '6379'));
          const password = configService.get<string>('REDIS_PASSWORD') || undefined;
          const db = Number(configService.get<string>('REDIS_DB', '0'));

          client = new Redis({
            ...commonOptions,
            host,
            port,
            password,
            db,
            tls: buildTlsOptions(tlsShouldEnable()),
          });
        }

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
