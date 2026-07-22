This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 本地开发

复制 `.env.example` 为 `.env`，填入 PostgreSQL 连接串，然后执行：

```bash
npm install
npm run db:push
npm run dev
```

生产部署推荐使用 Vercel（应用）+ Neon（PostgreSQL）+ Vercel Blob（照片）。部署步骤：

1. 将仓库导入 [Vercel](https://vercel.com/new)，Framework 选择 Next.js。
2. 在 Neon 创建数据库，将 `DATABASE_URL` 添加到 Vercel 项目的 Production 环境变量。
3. 在 Vercel Storage 创建 Blob，并将生成的 `BLOB_READ_WRITE_TOKEN` 添加到 Production 环境变量。
4. 在本地运行 `DATABASE_URL='生产连接串' npm run db:push` 创建表，然后在 Vercel 重新部署。

部署完成后 Vercel 会提供一个 `*.vercel.app` 公网地址，也可以绑定自己的域名。

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
