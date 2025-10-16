import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Swagger 服务
 * 管理 OpenAPI 文档
 */
@Injectable()
export class SwaggerService {
  private document: OpenAPIObject;

  /**
   * 设置 OpenAPI 文档
   */
  setDocument(document: OpenAPIObject) {
    this.document = document;
  }

  /**
   * 获取 OpenAPI 文档
   */
  getDocument(): OpenAPIObject {
    if (!this.document) {
      throw new Error('Swagger document not initialized');
    }
    return this.document;
  }

  /**
   * 获取 API 统计信息
   */
  getStats() {
    if (!this.document) {
      return {
        total: 0,
        paths: 0,
        tags: 0,
      };
    }

    const paths = Object.keys(this.document.paths || {});
    const tags = this.document.tags || [];

    // 计算总接口数
    let totalEndpoints = 0;
    paths.forEach((path) => {
      const methods = Object.keys(this.document.paths[path]);
      totalEndpoints += methods.length;
    });

    return {
      title: this.document.info?.title,
      version: this.document.info?.version,
      description: this.document.info?.description,
      totalEndpoints,
      totalPaths: paths.length,
      totalTags: tags.length,
      tags: tags.map((tag: any) => ({
        name: tag.name,
        description: tag.description,
      })),
      servers: this.document.servers || [],
    };
  }
}
