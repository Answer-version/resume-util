# 在线简历生成工具 V1 开发任务拆解清单

## 1. 目标

基于 PRD 和数据库 / API 设计文档，拆出可直接交给 Codex 或开发执行的 V1 任务。

---

## 2. 里程碑建议

### 里程碑 1：项目初始化

- 初始化 `Next.js` 项目
- 接入 `Tailwind CSS`
- 接入 `Prisma`
- 配置 `PostgreSQL` 或本地开发 `SQLite`
- 建立基础目录结构

### 里程碑 2：数据层完成

- 建立 `Resume`
- 建立 `ResumeVersion`
- 建立 `ResumePhoto`
- 编写初始化 migration
- 准备 seed 数据

### 里程碑 3：接口层完成

- 简历列表接口
- 新建简历接口
- 简历详情接口
- 保存版本接口
- 历史版本接口
- 简历复制接口
- 删除接口
- 照片上传接口
- PDF 导出接口

### 里程碑 4：前端核心页面完成

- 简历列表页
- 新建 / 编辑页
- 历史版本面板
- 模板切换
- 实时预览

### 里程碑 5：联调与验收

- 保存与历史恢复联调
- 照片上传与模板联调
- PDF 导出联调
- 空状态 / 错误状态补齐

---

## 3. 前端任务拆解

### 3.1 基础框架

- 搭建全局布局
- 配置页面路由
- 建立 UI 基础组件
- 统一表单校验方案

### 3.2 页面任务

#### 简历列表页

- 顶部新建按钮
- 简历列表展示
- 空状态
- 列表项操作：编辑 / 历史 / 复制 / 删除 / 导出

#### 简历编辑页

- 左侧信息表单
- 右侧实时预览
- 顶部工具栏：保存 / 另存为 / 导出 / 历史
- 模板切换控件
- 照片上传控件

#### 历史版本面板

- 版本时间线列表
- 版本预览
- 恢复按钮
- 基于历史版本另存为按钮

### 3.3 前端状态管理

- 当前简历详情状态
- 当前编辑草稿状态
- 历史版本列表状态
- 照片上传状态
- 保存中 / 导出中加载状态

---

## 4. 后端任务拆解

### 4.1 数据模型

- 编写 Prisma schema
- 建立迁移文件
- 定义枚举：`photo` / `no_photo`

### 4.2 服务层

- `createResume`
- `getResumeList`
- `getResumeDetail`
- `createResumeVersion`
- `duplicateResume`
- `restoreResumeVersion`
- `deleteResume`
- `uploadResumePhoto`
- `exportResumePdf`

### 4.3 接口层

- `GET /api/v1/resumes`
- `POST /api/v1/resumes`
- `GET /api/v1/resumes/:resumeId`
- `POST /api/v1/resumes/:resumeId/versions`
- `GET /api/v1/resumes/:resumeId/versions`
- `GET /api/v1/resumes/:resumeId/versions/:versionId`
- `POST /api/v1/resumes/:resumeId/duplicate`
- `POST /api/v1/resumes/:resumeId/versions/:versionId/restore`
- `DELETE /api/v1/resumes/:resumeId`
- `POST /api/v1/photos`
- `GET /api/v1/resumes/:resumeId/export/pdf`

---

## 5. PDF 导出任务

- 确定导出方案：优先浏览器打印 / 服务端 HTML 转 PDF
- 实现导出模板与页面预览一致
- 控制页边距、字号、头像尺寸
- 校验导出文件名规则

---

## 6. 测试任务

### 6.1 单元测试

- 创建简历
- 保存版本
- 恢复历史版本
- 复制简历
- 删除简历

### 6.2 集成测试

- 新建后立即进入编辑页
- 编辑保存后版本号递增
- 恢复历史版本后当前版本更新
- 照片模板切换正常
- 导出 PDF 成功

### 6.3 UI 验收

- 列表页空状态可用
- 表单校验提示清晰
- 预览区内容与输入一致
- 移除照片后无布局错乱

---

## 7. 推荐目录结构

```text
src/
  app/
    resumes/
      page.tsx
      [resumeId]/
        page.tsx
    api/
      v1/
        resumes/
        photos/
  components/
    resumes/
    ui/
  lib/
    db/
    services/
    validators/
  types/
prisma/
  schema.prisma
docs/
```

---

## 8. 建议执行顺序

1. 初始化项目骨架
2. 完成 Prisma schema 和 migration
3. 打通新建简历、详情、保存版本三个核心接口
4. 完成列表页和编辑页
5. 再补历史版本、复制、删除、导出

---

## 9. 适合直接交给 Codex 的首批开发指令

### 任务包 A

- 初始化 `Next.js + Tailwind + Prisma`
- 创建基础目录结构
- 写出 Prisma schema

### 任务包 B

- 实现简历列表页
- 实现简历编辑页静态 UI
- 实现双栏编辑 + 预览布局

### 任务包 C

- 接通新建 / 详情 / 保存版本接口
- 完成版本保存联调

### 任务包 D

- 接通历史版本
- 接通 PDF 导出
- 完成验收测试

---

## 10. 下一步建议

如果继续按这个节奏推进，下一步最适合直接开始：`初始化项目结构并落第一版代码骨架`。
