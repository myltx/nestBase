import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: 'NestBase',
    description: '现代化全栈应用框架文档',
    lastUpdated: true,
    ignoreDeadLinks: true,
    mermaid: {
      // mermaidConfig
    },
    themeConfig: {
      nav: [
        { text: '指南', link: '/guides/USAGE.zh-CN' },
        { text: '前端', link: '/frontend/README' },
        { text: '后端', link: '/backend/README' },
        { text: '项目管理', link: '/project/README' },
      ],

      sidebar: {
        '/frontend/': [
          {
            text: '前端服务',
            items: [
              { text: '概览', link: '/frontend/README' },
              { text: '前后端联调指南', link: '/guides/INTEGRATION.zh-CN' },
            ],
          },
        ],
        '/guides/': [
          {
            text: '指南',
            items: [{ text: '使用说明', link: '/guides/USAGE.zh-CN' }],
          },
        ],
        '/plans/': [
          {
            text: '计划文档',
            items: [
              { text: 'API 优化计划', link: '/plans/api_optimization_plan' },
              { text: 'API 重构计划', link: '/plans/api_refactor_tags_logs_categories_plan' },
              { text: '基础数据模块', link: '/plans/basic_data_module_implementation' },
            ],
          },
        ],
        '/reports/': [
          {
            text: '分析报告',
            items: [
              { text: '项目分析', link: '/reports/ANALYSIS_REPORT' },
              { text: 'API 优化报告', link: '/reports/API_OPTIMIZATION_REPORT' },
              { text: '结构与API分析', link: '/reports/structure_and_api_analysis' },
            ],
          },
        ],
        '/standards/': [
          {
            text: '规范标准',
            items: [{ text: 'API 治理标准', link: '/standards/api_governance_standard' }],
          },
        ],
        '/backend/': [
          {
            text: '后端概览',
            items: [{ text: 'Readme', link: '/backend/README' }],
          },
          {
            text: '架构设计',
            collapsed: true,
            items: [
              { text: 'API 命名规范', link: '/backend/architecture/API_NAMING_CONVENTION' },
              { text: '业务状态码', link: '/backend/architecture/BUSINESS_CODES' },
              { text: '验证管道配置', link: '/backend/architecture/VALIDATION_PIPE_CONFIG' },
              { text: 'Redis 分析', link: '/backend/architecture/REDIS_ANALYSIS' },
            ],
          },
          {
            text: '功能特性',
            collapsed: true,
            items: [
              { text: '新权限系统', link: '/backend/features/NEW_PERMISSION_SYSTEM' },
              { text: 'Token 实现', link: '/backend/features/TOKEN_IMPLEMENTATION_SUMMARY' },
              { text: '日志系统', link: '/backend/features/LOGGING_SYSTEM_RELEASE' },
              { text: '内容管理', link: '/backend/features/CONTENT_MANAGEMENT_MODULE' },
            ],
          },
          {
            text: '开发指南',
            collapsed: true,
            items: [
              { text: '用户模块', link: '/backend/guides/users-module' },
              { text: '项目模块', link: '/backend/guides/projects-module' },
              { text: 'CMS API', link: '/backend/guides/CMS_API_GUIDE' },
              { text: '菜单管理', link: '/backend/guides/MENU_MANAGEMENT' },
              { text: '审计日志', link: '/backend/guides/AUDIT_USAGE' },
            ],
          },
          {
            text: '数据库迁移',
            collapsed: true,
            items: [{ text: '迁移指南', link: '/backend/migrations/MIGRATION_GUIDE' }],
          },
        ],
        '/project/': [
          {
            text: '项目概览',
            items: [{ text: 'Readme', link: '/project/README' }],
          },
          {
            text: '环境搭建',
            items: [
              { text: '快速开始', link: '/project/setup/QUICKSTART' },
              { text: 'Supabase 配置', link: '/project/setup/SUPABASE_SETUP' },
              { text: 'Monorepo 说明', link: '/project/setup/MONOREPO' },
            ],
          },
          {
            text: 'API 工具',
            items: [
              { text: 'OpenAPI 实现', link: '/project/api-tools/OPENAPI_IMPLEMENTATION' },
              { text: 'Apifox 导入', link: '/project/api-tools/APIFOX_IMPORT_GUIDE' },
            ],
          },
          {
            text: '开发文档',
            items: [
              { text: '文档更新清单', link: '/project/development/DOCS_UPDATE_CHECKLIST' },
              { text: '代码检查报告', link: '/project/development/CODE_CHECK_REPORT' },
            ],
          },
          {
            text: '项目管理',
            items: [{ text: '交付报告', link: '/project/project-management/DELIVERY' }],
          },
        ],
      },

      socialLinks: [{ icon: 'github', link: 'https://github.com/myltx/nestBase' }],
    },
  }),
);
