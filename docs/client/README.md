# NestBase Client 文档

> 📚 **文档版本**: v1.0.0
> 📅 **最后更新**: 2026-02-04
> 🖥️ **包含**: Web 端管理后台 & Mobile 移动端

---

## 📂 文档结构

```
docs/client/
├── README.md           # 本文件
├── web/                # Web 端管理后台 (Vue3 + NaiveUI)
│   └── README.md
└── mobile/             # 移动端 (UniApp + Vue3)
    └── README.md
```

## 🚀 客户端应用概览

NestBase 包含两个主要的客户端应用，均接入同一套 NestJS 后端 API。

| 应用           | 目录            | 技术栈                | 端口   | 说明                                    |
| -------------- | --------------- | --------------------- | ------ | --------------------------------------- |
| **Web Admin**  | `apps/frontend` | Vue 3, Vite, Naive UI | `5173` | PC 端管理后台，提供完整的系统管理功能   |
| **Mobile App** | `apps/mobile`   | UniApp, Vue 3, Wot UI | `9000` | 移动端应用 (小程序/H5)，提供C端用户功能 |

## 🔗 快速入口

- [Web 端开发指南](./web/README.md)
- [Mobile 端开发指南](./mobile/README.md)
- [前后端联调指南](../guides/INTEGRATION.zh-CN.md)

---
