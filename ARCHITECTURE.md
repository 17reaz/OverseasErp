# OverseasErp — Multi-Server Architecture

## 1. Overview

OverseasErp একটি multi-tenant ERP application।

বর্তমানে application Vercel-এ চলছে। ভবিষ্যতে একই application-এর কিছু user AWS infrastructure-এ এবং কিছু user self-hosted Node/Deno server-এ চালানো যাবে।

মূল লক্ষ্য:

* একই React frontend codebase রাখা
* একই business logic রাখা
* একাধিক server/environment support করা
* AWS-কে optional service হিসেবে ব্যবহার করা
* AWS unavailable হলেও Core ERP চালু রাখা
* প্রয়োজন অনুযায়ী user/tenant-কে আলাদা infrastructure-এ চালানো
* ভবিষ্যতে infrastructure scale করা সহজ রাখা

---

# 2. High-Level Architecture

```text
                         Users
                           │
              ┌────────────┴────────────┐
              │                         │
        Environment A             Environment B
          Vercel/A              AWS / Self-hosted
              │                         │
              ▼                         ▼
        React PWA                  React PWA
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                      Hono API
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
            Supabase      S3      AWS Services
                │                     │
                │              ┌──────┼──────┐
                │              ▼      ▼      ▼
                │             S3   Textract SQS
                │                            │
                │                          Lambda
                │
                ▼
             Core ERP
```

---

# 3. Core Principle

Architecture-এর সবচেয়ে গুরুত্বপূর্ণ rule:

> **Core ERP কখনো AWS-এর উপর hard dependency রাখবে না।**

Core ERP:

* Candidates
* Agents
* Agencies
* Workflow
* Medical
* MOFA
* Visa
* BMET
* Flight
* Finance
* Transactions
* Accounts
* Reports
* Users
* Tenants

এসব AWS unavailable হলেও চলতে হবে।

AWS-dependent features:

* Document upload
* OCR
* Textract
* Heavy processing
* Background processing
* Large file processing

এসব unavailable হলে শুধু সংশ্লিষ্ট feature unavailable থাকবে।

---

# 4. Frontend Architecture

React/Vite frontend একটি API abstraction ব্যবহার করবে।

```text
React
  │
  ▼
API Client
  │
  ▼
VITE_API_URL
```

Example:

```env
VITE_API_URL=https://api.reaz.shop
```

অন্য environment:

```env
VITE_API_URL=https://api-aws.reaz.shop
```

আরেকটি:

```env
VITE_API_URL=https://api-server.reaz.shop
```

Frontend code পরিবর্তন না করেই deployment অনুযায়ী API server পরিবর্তন করা যাবে।

---

# 5. Multiple Environments

## Environment A — Vercel

```text
Users
  ↓
Vercel
  ↓
React PWA
  ↓
Hono API
  ↓
Supabase
```

এটি বর্তমান production environment হতে পারে।

---

## Environment B — AWS

```text
Users
  ↓
AWS
  ↓
React / Hono
  ↓
Supabase
  ↓
S3
  ↓
Textract
  ↓
SQS
  ↓
Lambda
```

AWS environment-এ heavy document processing এবং background jobs ব্যবহার করা যাবে।

---

## Environment C — Self Hosted

```text
Users
  ↓
Own Server
  ↓
Hono
  ↓
Supabase
  ↓
Optional AWS Services
```

নিজস্ব Node/Deno server ব্যবহার করে কিছু user বা tenant চালানো যাবে।

---

# 6. Runtime Strategy

Frontend:

```text
React + Vite
```

Existing development workflow:

```text
Bun
```

Backend:

```text
Hono
```

Backend runtime:

```text
Deno
```

Architecture:

```text
Frontend
React/Vite
    ↓
Bun development tooling

Backend
Hono
    ↓
Deno runtime
```

Frontend এবং backend আলাদা runtime ব্যবহার করতে পারবে।

---

# 7. Backend Structure

```text
server/
│
├── main.ts
│
├── routes/
│   ├── health.ts
│   ├── candidates.ts
│   ├── documents.ts
│   ├── files.ts
│   └── reports.ts
│
├── services/
│   ├── supabase.ts
│   ├── s3.ts
│   └── textract.ts
│
├── middleware/
│   └── auth.ts
│
└── types/
    └── api.ts
```

Responsibilities:

### `main.ts`

Hono application entry point।

### `routes/`

HTTP API endpoints।

### `services/`

External service integrations।

### `middleware/`

Authentication, authorization, tenant validation ইত্যাদি।

### `types/`

Shared API types।

---

# 8. AWS as Optional Infrastructure

AWS service সরাসরি React থেকে call করা যাবে না।

Incorrect:

```text
React
  ↓
AWS
```

Correct:

```text
React
  ↓
Hono
  ↓
AWS
```

এর ফলে:

* AWS credentials browser-এ যাবে না
* AWS error centrally handle করা যাবে
* Authentication centrally করা যাবে
* Tenant authorization করা যাবে
* AWS provider পরিবর্তন করা সহজ হবে

---

# 9. AWS Failure Strategy

AWS unavailable হলে পুরো application crash করা যাবে না।

Example:

```text
React
  ↓
POST /api/documents
  ↓
Hono
  ↓
Textract
  ↓
AWS ERROR
```

Hono error handle করবে:

```json
{
  "ok": false,
  "service": "textract",
  "status": "unavailable",
  "message": "Document processing is temporarily unavailable."
}
```

Core application চলতে থাকবে।

---

# 10. Feature Flags

AWS services enable/disable করার জন্য environment variables ব্যবহার করা হবে।

Example:

```env
AWS_ENABLED=false
```

Production AWS environment:

```env
AWS_ENABLED=true
```

Textract:

```env
TEXTRACT_ENABLED=true
```

S3:

```env
S3_ENABLED=true
```

এতে AWS ছাড়া local development-ও সম্ভব হবে।

---

# 11. Health Check

API health endpoint থাকবে:

```text
GET /api/health
```

Example:

```json
{
  "ok": true,
  "service": "overseas-erp-api",
  "runtime": "deno"
}
```

Future version:

```json
{
  "ok": true,
  "database": "healthy",
  "aws": {
    "enabled": true,
    "s3": "healthy",
    "textract": "unavailable"
  }
}
```

এখানে Textract unavailable হলেও পুরো API:

```text
ok: true
```

থাকতে পারে, কারণ Core ERP operational।

---

# 12. Document Processing Architecture

Document processing synchronous করা হবে না।

Incorrect:

```text
React
 ↓
Hono
 ↓
Textract
 ↓
Wait
 ↓
Response
```

Correct:

```text
React
 ↓
Hono
 ↓
Create document job
 ↓
S3
 ↓
Textract Job
 ↓
SNS
 ↓
SQS
 ↓
Lambda
 ↓
Process result
 ↓
Supabase
 ↓
React
```

React শুধু job status track করবে।

Example:

```text
queued
   ↓
processing
   ↓
completed
```

অথবা:

```text
queued
   ↓
processing
   ↓
failed
```

---

# 13. Multi-Tenant Deployment

ভবিষ্যতে tenant অনুযায়ী infrastructure আলাদা করা সম্ভব হবে।

Example:

```text
Tenant A
  ↓
Vercel API

Tenant B
  ↓
AWS API

Tenant C
  ↓
Self-hosted API
```

একই frontend application ব্যবহার করা যেতে পারে।

Tenant routing একটি configuration layer-এর মাধ্যমে করা হবে।

---

# 14. API Routing

Possible infrastructure:

```text
api.reaz.shop
```

```text
api-aws.reaz.shop
```

```text
api-server.reaz.shop
```

Frontend:

```env
VITE_API_URL=https://api.reaz.shop
```

Environment B:

```env
VITE_API_URL=https://api-aws.reaz.shop
```

Environment C:

```env
VITE_API_URL=https://api-server.reaz.shop
```

---

# 15. Data Layer

Core application data:

```text
Supabase
```

Local client cache:

```text
Dexie / IndexedDB
```

Server state:

```text
TanStack Query
```

Client/UI state:

```text
Zustand
```

Architecture:

```text
React
 │
 ├── Zustand
 │     └── UI state
 │
 └── TanStack Query
       │
       ├── Online
       │     ↓
       │   Hono
       │     ↓
       │   Supabase
       │
       └── Offline
             ↓
           Dexie
```

---

# 16. Heavy Processing

CPU-heavy কাজ browser main thread-এ করা হবে না।

Web Worker ব্যবহার করা হবে:

```text
src/lib/worker/
├── app-worker.ts
├── worker-client.ts
└── jobs/
    ├── image-worker.ts
    ├── report-worker.ts
    ├── csv-worker.ts
    └── sync-worker.ts
```

AWS Lambda ব্যবহার করা হবে server-side heavy/background processing-এর জন্য।

```text
Browser Worker
    ↓
Client-side heavy processing

Lambda
    ↓
Server-side heavy processing
```

---

# 17. Failure Isolation

প্রতিটি external service isolated থাকবে।

```text
Supabase
   │
   └── Core ERP

AWS S3
   │
   └── File Storage

Textract
   │
   └── OCR

SQS
   │
   └── Queue

Lambda
   │
   └── Background Processing
```

যদি:

```text
Textract ❌
```

তাহলে:

```text
Candidates ✅
Finance ✅
Agents ✅
Workflow ✅
Supabase ✅
```

শুধু:

```text
OCR ❌
```

হবে।

---

# 18. Deployment Philosophy

একটি application-এর জন্য একটি server বাধ্যতামূলক নয়।

একই codebase বিভিন্ন infrastructure-এ deploy করা যাবে:

```text
                    GitHub
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
         Vercel       AWS      Self-host
            │          │          │
            ▼          ▼          ▼
        Environment A B         C
```

প্রতিটি environment-এর configuration আলাদা হতে পারে।

Codebase একই থাকবে।

---

# 19. Security Rules

### Never expose

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
Supabase Service Role Key
```

React frontend-এ।

### Browser should receive only

```text
Public configuration
```

### Secrets stay in

```text
Deno server
AWS environment
Vercel environment variables
Self-hosted server environment
```

---

# 20. Implementation Roadmap

### Phase 1 — Backend Foundation

```text
Deno
 ↓
Hono
 ↓
/api/health
```

### Phase 2 — Authentication

```text
React
 ↓
Hono
 ↓
Supabase Auth
```

### Phase 3 — Core API

```text
Candidates
Agents
Documents
Files
Reports
```

### Phase 4 — AWS S3

```text
Hono
 ↓
S3
```

### Phase 5 — Textract

```text
S3
 ↓
Textract
```

### Phase 6 — Async Processing

```text
Textract
 ↓
SNS
 ↓
SQS
 ↓
Lambda
```

### Phase 7 — Multi-Environment

```text
Vercel
AWS
Self-hosted
```

### Phase 8 — Multi-Tenant Routing

```text
Tenant
 ↓
Environment
 ↓
API
```

---

# 21. Final Architecture

```text
```
