# 在线简历生成工具 V1 数据库表设计与 API 设计

## 1. 文档目标

本文件承接上一版 PRD，用于明确 V1 的后端数据结构、接口边界和基础业务规则，便于直接进入开发。

V1 目标聚焦于：

- 多份简历管理
- 基础信息编辑
- 带照片 / 不带照片模板切换
- 历史版本保存与恢复
- PDF 导出

---

## 2. 设计原则

1. 一份简历对应多个历史版本
2. 当前展示内容始终来自某个“当前版本”
3. 每次保存都生成一条版本快照，不覆盖历史
4. “另存为”会生成一份新的简历，不与原简历共用版本链
5. 模板和内容解耦，同一份数据可以切换不同模板

---

## 3. 核心实体关系

### 3.1 实体清单

- `resumes`：简历主表
- `resume_versions`：简历历史版本表
- `resume_photos`：照片资源表（V1 可选，建议保留）

### 3.2 实体关系

- 一份 `resume` 有多条 `resume_version`
- 一份 `resume` 通过 `current_version_id` 指向当前生效版本
- 一张照片可以被一个版本引用

---

## 4. 数据库表设计

以下设计默认使用 `PostgreSQL`，字段风格按 `snake_case` 约定。

### 4.1 resumes

用于存放简历主记录，主要承担“容器”和“当前版本索引”的职责。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | uuid | 是 | 简历 ID |
| title | varchar(120) | 是 | 简历名称，如“产品经理-基础版” |
| target_job | varchar(120) | 是 | 求职岗位 |
| template_type | varchar(32) | 是 | `photo` / `no_photo` |
| current_version_id | uuid | 否 | 当前生效版本 ID |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |
| deleted_at | timestamptz | 否 | 软删除时间 |

#### 约束建议

- `template_type` 仅允许 `photo`、`no_photo`
- `deleted_at` 为空表示正常状态
- `current_version_id` 必须属于当前 `resume`

### 4.2 resume_versions

用于保存每次“保存”后的完整快照。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | uuid | 是 | 版本 ID |
| resume_id | uuid | 是 | 所属简历 ID |
| version_number | int | 是 | 版本号，从 1 递增 |
| snapshot_data | jsonb | 是 | 当前版本完整数据快照 |
| note | varchar(200) | 否 | 版本备注，V1 可先为空 |
| created_at | timestamptz | 是 | 版本生成时间 |

#### snapshot_data 建议结构

```json
{
  "name": "张三",
  "gender": "男",
  "age": 27,
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "targetJob": "产品经理",
  "templateType": "photo",
  "photo": {
    "photoId": "uuid-or-null",
    "url": "/uploads/resume-photos/abc.jpg"
  }
}
```

#### 说明

- `snapshot_data` 存整份快照，恢复版本时不需要做字段级合并
- 即使主表已有 `target_job` 和 `template_type`，版本内也保留一份，便于历史回看

### 4.3 resume_photos

V1 只有“是否带照片”的需求，但建议把照片作为独立资源管理，避免后续导出、替换、裁切逻辑变复杂。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | uuid | 是 | 照片 ID |
| file_name | varchar(255) | 是 | 原始文件名 |
| file_url | varchar(500) | 是 | 存储地址 |
| mime_type | varchar(64) | 是 | 文件类型 |
| file_size | int | 是 | 文件大小，单位 byte |
| width | int | 否 | 图片宽度 |
| height | int | 否 | 图片高度 |
| created_at | timestamptz | 是 | 上传时间 |

#### 说明

- 如果你想极简落地，V1 也可以不建这张表，直接把 `photoUrl` 存到版本 JSON 里
- 但从工程可维护性看，保留资源表更稳

---

## 5. 推荐索引

### resumes

- `idx_resumes_updated_at (updated_at desc)`
- `idx_resumes_deleted_at (deleted_at)`
- `idx_resumes_target_job (target_job)`

### resume_versions

- `idx_resume_versions_resume_id_created_at (resume_id, created_at desc)`
- `uniq_resume_versions_resume_id_version_number (resume_id, version_number)`

### resume_photos

- `idx_resume_photos_created_at (created_at desc)`

---

## 6. Prisma Schema 建议稿

如果技术栈使用 `Next.js + Prisma + PostgreSQL`，可以按下面方式建模。

```prisma
model Resume {
  id               String          @id @default(uuid()) @db.Uuid
  title            String          @db.VarChar(120)
  targetJob        String          @map("target_job") @db.VarChar(120)
  templateType     ResumeTemplate  @map("template_type")
  currentVersionId String?         @map("current_version_id") @db.Uuid
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")
  deletedAt        DateTime?       @map("deleted_at")

  versions         ResumeVersion[]

  @@index([updatedAt(sort: Desc)])
  @@index([deletedAt])
  @@index([targetJob])
  @@map("resumes")
}

model ResumeVersion {
  id            String    @id @default(uuid()) @db.Uuid
  resumeId      String    @map("resume_id") @db.Uuid
  versionNumber Int       @map("version_number")
  snapshotData  Json      @map("snapshot_data")
  note          String?   @db.VarChar(200)
  createdAt     DateTime  @default(now()) @map("created_at")

  resume        Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@unique([resumeId, versionNumber])
  @@index([resumeId, createdAt(sort: Desc)])
  @@map("resume_versions")
}

model ResumePhoto {
  id        String   @id @default(uuid()) @db.Uuid
  fileName  String   @map("file_name") @db.VarChar(255)
  fileUrl   String   @map("file_url") @db.VarChar(500)
  mimeType  String   @map("mime_type") @db.VarChar(64)
  fileSize  Int      @map("file_size")
  width     Int?
  height    Int?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([createdAt(sort: Desc)])
  @@map("resume_photos")
}

enum ResumeTemplate {
  photo
  no_photo
}
```

---

## 7. API 设计

V1 建议采用 REST API。前后端职责明确，后续接 Web、桌面端都比较顺手。

统一前缀建议为：`/api/v1`

### 7.1 简历列表

#### GET `/api/v1/resumes`

获取简历列表。

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 按标题 / 岗位模糊搜索，V1 可选 |
| templateType | string | 否 | `photo` / `no_photo` |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |

**响应示例**

```json
{
  "data": [
    {
      "id": "resume_001",
      "title": "产品经理-基础版",
      "targetJob": "产品经理",
      "templateType": "photo",
      "updatedAt": "2026-07-09T08:00:00.000Z",
      "createdAt": "2026-07-09T07:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1
  }
}
```

### 7.2 新建简历

#### POST `/api/v1/resumes`

创建简历主记录，并自动生成版本 `1`。

**请求体**

```json
{
  "title": "产品经理-基础版",
  "targetJob": "产品经理",
  "templateType": "photo",
  "content": {
    "name": "张三",
    "gender": "男",
    "age": 27,
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "targetJob": "产品经理",
    "templateType": "photo",
    "photo": {
      "photoId": "photo_001",
      "url": "/uploads/resume-photos/a.jpg"
    }
  }
}
```

**响应示例**

```json
{
  "id": "resume_001",
  "currentVersionId": "version_001"
}
```

### 7.3 获取简历详情

#### GET `/api/v1/resumes/:resumeId`

返回简历主信息和当前版本快照，用于编辑页初始化。

**响应示例**

```json
{
  "id": "resume_001",
  "title": "产品经理-基础版",
  "targetJob": "产品经理",
  "templateType": "photo",
  "currentVersionId": "version_003",
  "createdAt": "2026-07-09T07:30:00.000Z",
  "updatedAt": "2026-07-09T08:20:00.000Z",
  "currentVersion": {
    "id": "version_003",
    "versionNumber": 3,
    "createdAt": "2026-07-09T08:20:00.000Z",
    "snapshotData": {
      "name": "张三",
      "gender": "男",
      "age": 27,
      "email": "zhangsan@example.com",
      "phone": "13800138000",
      "targetJob": "高级产品经理",
      "templateType": "photo",
      "photo": {
        "photoId": "photo_001",
        "url": "/uploads/resume-photos/a.jpg"
      }
    }
  }
}
```

### 7.4 保存简历

#### POST `/api/v1/resumes/:resumeId/versions`

保存当前修改，生成新版本。

**请求体**

```json
{
  "title": "产品经理-高级版",
  "targetJob": "高级产品经理",
  "templateType": "no_photo",
  "note": "切换为高级产品经理投递版本",
  "content": {
    "name": "张三",
    "gender": "男",
    "age": 27,
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "targetJob": "高级产品经理",
    "templateType": "no_photo",
    "photo": null
  }
}
```

**响应示例**

```json
{
  "resumeId": "resume_001",
  "currentVersionId": "version_004",
  "versionNumber": 4,
  "updatedAt": "2026-07-09T08:35:00.000Z"
}
```

### 7.5 复制简历 / 另存为

#### POST `/api/v1/resumes/:resumeId/duplicate`

基于当前简历最新版本复制出一份新简历。

**请求体**

```json
{
  "title": "产品经理-副本",
  "targetJob": "产品经理"
}
```

**说明**

- 会新建一条 `resume`
- 会基于原简历当前版本生成新简历的版本 `1`

### 7.6 删除简历

#### DELETE `/api/v1/resumes/:resumeId`

软删除简历。

**响应示例**

```json
{
  "success": true
}
```

---

## 8. 历史版本 API

### 8.1 获取版本列表

#### GET `/api/v1/resumes/:resumeId/versions`

获取某份简历的历史版本列表。

**响应示例**

```json
{
  "data": [
    {
      "id": "version_004",
      "versionNumber": 4,
      "note": "切换为高级产品经理投递版本",
      "createdAt": "2026-07-09T08:35:00.000Z"
    },
    {
      "id": "version_003",
      "versionNumber": 3,
      "note": null,
      "createdAt": "2026-07-09T08:20:00.000Z"
    }
  ]
}
```

### 8.2 获取单个版本详情

#### GET `/api/v1/resumes/:resumeId/versions/:versionId`

用于历史版本预览。

### 8.3 恢复历史版本

#### POST `/api/v1/resumes/:resumeId/versions/:versionId/restore`

恢复某个历史版本为当前版本。恢复动作本身也会生成一个新版本，而不是直接改写旧版本。

**请求体**

```json
{
  "note": "恢复到版本 2"
}
```

**业务规则**

1. 读取目标历史版本快照
2. 新生成一条版本记录
3. 更新 `resumes.current_version_id`
4. 更新 `resumes.target_job`、`resumes.template_type`、`updated_at`

### 8.4 基于历史版本另存为

#### POST `/api/v1/resumes/:resumeId/versions/:versionId/duplicate`

基于某个历史版本创建新简历。

---

## 9. 照片上传 API

### 9.1 上传照片

#### POST `/api/v1/photos`

`multipart/form-data`

**字段**

- `file`

**校验建议**

- 格式：`jpg`、`jpeg`、`png`
- 大小：不超过 `5MB`

**响应示例**

```json
{
  "id": "photo_001",
  "url": "/uploads/resume-photos/a.jpg",
  "fileName": "avatar.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 245678
}
```

---

## 10. PDF 导出 API

### 10.1 导出当前简历 PDF

#### GET `/api/v1/resumes/:resumeId/export/pdf`

导出当前版本 PDF。

### 10.2 导出指定版本 PDF

#### GET `/api/v1/resumes/:resumeId/versions/:versionId/export/pdf`

用于从历史版本直接导出。

**响应方式**

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="张三-产品经理-2026-07-09.pdf"`

---

## 11. 字段校验规则

### 11.1 基础字段

| 字段 | 规则 |
| --- | --- |
| title | 必填，1-120 字 |
| name | 必填，1-50 字 |
| gender | 必填，枚举值，建议 `男` / `女` / `其他` |
| age | 必填，1-120 的整数 |
| email | 必填，标准邮箱格式 |
| phone | 必填，建议按中国大陆手机号校验，后续可国际化 |
| targetJob | 必填，1-120 字 |
| templateType | 必填，`photo` / `no_photo` |

### 11.2 业务校验

1. 当 `templateType = photo` 时，允许无照片，但前端需展示默认占位
2. 当 `templateType = no_photo` 时，前端隐藏照片区域，但历史数据里的照片信息可保留
3. 删除后的简历不可出现在默认列表中

---

## 12. 关键业务规则

### 12.1 保存

- 点击保存后，永远新增版本
- 不做“覆盖当前版本”的更新式保存

### 12.2 恢复

- 恢复本质是“以历史版本内容创建一个新当前版本”
- 历史版本不可变

### 12.3 复制

- 复制的是内容，不是版本链
- 新简历从 `version_number = 1` 开始

### 12.4 删除

- 简历主表采用软删除
- 历史版本默认保留，不做物理删除

---

## 13. 推荐接口开发优先级

### P0

1. `GET /resumes`
2. `POST /resumes`
3. `GET /resumes/:resumeId`
4. `POST /resumes/:resumeId/versions`
5. `GET /resumes/:resumeId/versions`
6. `POST /photos`
7. `GET /resumes/:resumeId/export/pdf`

### P1

1. `POST /resumes/:resumeId/duplicate`
2. `DELETE /resumes/:resumeId`
3. `GET /resumes/:resumeId/versions/:versionId`
4. `POST /resumes/:resumeId/versions/:versionId/restore`

### P2

1. `POST /resumes/:resumeId/versions/:versionId/duplicate`
2. 搜索 / 筛选接口增强
3. 版本备注编辑

---

## 14. 建议的下一步

基于这份文档，最顺手的推进顺序是：

1. 先定技术栈：`Next.js + Prisma + PostgreSQL + Tailwind`
2. 直接产出 `页面原型说明`
3. 然后让 Codex 开始搭项目骨架和数据库 schema

如果你准备进入开发阶段，下一步最适合做的是：`开发任务拆解清单 + 初始化项目结构`。
