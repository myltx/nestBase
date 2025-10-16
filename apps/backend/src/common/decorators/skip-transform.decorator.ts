import { SetMetadata } from '@nestjs/common';

/**
 * 跳过响应转换拦截器
 * 用于需要返回原始数据的接口（如 OpenAPI JSON）
 */
export const SKIP_TRANSFORM_KEY = 'skipTransform';
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
