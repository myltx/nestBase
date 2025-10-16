/**
 * 项目种子数据
 * 用于填充示例项目数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const projects = [
  {
    title: '极客博客系统',
    description:
      '基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统，支持Markdown写作、代码高亮、全文搜索等功能',
    url: 'https://mindlog.myltx.top',
    tech: ['Nuxt.js', 'TypeScript', 'UnoCSS', 'Nuxt Content'],
    github: 'https://github.com/mindLog',
    demo: 'https://mindlog.myltx.top',
    featured: true,
  },
  {
    title: 'NestBase 全栈框架',
    description:
      '基于 NestJS + Supabase + Prisma 构建的企业级后端服务框架，支持JWT认证、RBAC权限控制、自动生成Swagger文档',
    url: 'https://github.com/nestbase',
    tech: ['NestJS', 'TypeScript', 'Prisma', 'Supabase', 'PostgreSQL'],
    github: 'https://github.com/nestbase',
    demo: null,
    featured: true,
  },
  {
    title: 'Vue3 组件库',
    description: '基于 Vue 3 + TypeScript 开发的轻量级 UI 组件库，提供常用的表单、数据展示、反馈组件',
    url: null,
    tech: ['Vue 3', 'TypeScript', 'Vite', 'Sass'],
    github: 'https://github.com/vue3-components',
    demo: 'https://vue3-components.demo.com',
    featured: false,
  },
  {
    title: 'React Native 移动应用',
    description: '跨平台移动应用开发框架项目，支持 iOS 和 Android，包含用户认证、数据同步等功能',
    url: null,
    tech: ['React Native', 'TypeScript', 'Redux', 'Firebase'],
    github: 'https://github.com/rn-app',
    demo: null,
    featured: false,
  },
  {
    title: 'Next.js 电商平台',
    description: '基于 Next.js 14 + App Router 构建的现代化电商平台，支持SSR、ISR、购物车、订单管理等功能',
    url: 'https://shop.example.com',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Stripe', 'MongoDB'],
    github: 'https://github.com/nextjs-shop',
    demo: 'https://shop.example.com',
    featured: true,
  },
];

/**
 * 填充项目数据
 */
async function seedProjects() {
  console.log('开始填充项目数据...');

  for (const project of projects) {
    const created = await prisma.project.create({
      data: project,
    });
    console.log(`✅ 创建项目: ${created.title}`);
  }

  console.log(`\n🎉 成功创建 ${projects.length} 个项目！`);
}

/**
 * 主函数
 */
async function main() {
  try {
    await seedProjects();
  } catch (error) {
    console.error('❌ 种子数据填充失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
