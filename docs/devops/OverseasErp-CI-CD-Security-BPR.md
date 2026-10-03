# OverseasErp — CI/CD, Testing & Security BPR

## 1. Project Goal

OverseasErp-এর development workflow এমনভাবে তৈরি করা হবে যাতে:

- নতুন code সরাসরি `main`-এ না যায়
- Pull Request ছাড়া production code merge না হয়
- প্রতিটি PR automatically test হয়
- TypeScript error ধরা পড়ে
- ESLint error ধরা পড়ে
- Unit test run হয়
- Production build verify হয়
- Dependency vulnerability check হয়
- `main` protected থাকে
- Production deployment শুধুমাত্র verified code থেকে হয়
- ভবিষ্যতে Supabase RLS/security test যোগ করা যায়

### Target workflow

```text
Developer
   │
   ▼
feature/*
   │
   ▼
Pull Request → main
   │
   ▼
GitHub CI
   │
   ├── Bun install --frozen-lockfile
   ├── Typecheck
   ├── ESLint
   ├── Unit Tests
   └── Production Build
   │
   ▼
ALL CHECKS PASSED
   │
   ▼
Protected main
   │
   ▼
CD / Vercel Production
```

---

## 2. Current Stack

```text
Frontend
├── React 19
├── TypeScript
├── Vite
├── Tailwind CSS
├── shadcn/ui
├── React Router
├── Zustand
├── TanStack Query
└── Dexie

Backend / Data
├── Supabase
├── PostgreSQL
├── Supabase Auth
└── RLS

Runtime / Package Manager
└── Bun

Deployment
└── Vercel

CI/CD
└── GitHub Actions
```

---

## 3. Repository Structure

Final structure approximately:

```text
OverseasErp/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd.yml
│       ├── dependency-check.yml
│       ├── release.yml
│       └── vercel-check.yml
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── modules/
│
├── tests/
│   └── candidate-stage.test.ts
│
├── public/
│
├── package.json
├── bun.lock
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
└── README.md
```

---

# 4. Testing Strategy

Testing একবারে পুরো project-এ না দিয়ে critical business logic থেকে শুরু করা হবে।

## Phase 1 — Unit Testing

প্রথমে pure business logic test হবে।

Priority:

```text
Candidate Stage Engine
        ↓
Finance Calculations
        ↓
Candidate Status
        ↓
Workflow Logic
        ↓
Selectors / Utilities
```

---

# 5. First Test — Candidate Stage Engine

File:

```text
tests/candidate-stage.test.ts
```

এটা `src`-এর ভিতরে হবে না।

সরাসরি project root-এ:

```text
OverseasErp/
├── src/
├── tests/
│   └── candidate-stage.test.ts
└── package.json
```

### Test objective

Candidate workflow-এর:

```text
Candidate
 ↓
Medical
 ↓
MOFA
 ↓
Finger
 ↓
Police Clearance
 ↓
Takamul
 ↓
Visa
 ↓
Flight
 ↓
Iqama
```

logic ঠিক আছে কিনা verify করা।

---

# 6. Candidate Stage Tests

### Test 1 — Pipeline order

Verify:

```text
candidate
medical
mofa
finger
police_clearance
takamul
visa
flight
iqama
```

এই order ঠিক থাকে।

### Test 2 — Unrequested services skip

যদি:

```text
medical = false
finger = false
police_clearance = false
```

তাহলে এগুলো pipeline থেকে বাদ যাবে।

### Test 3 — Current stage

যদি:

```text
medical = completed
mofa = completed
finger = not_started
```

তাহলে:

```text
currentStage = finger
```

হবে।

### Test 4 — Out-of-order completion

ধরো:

```text
medical = completed
finger = completed
police_clearance = completed
mofa = not_started
```

তাহলে current stage হবে:

```text
mofa
```

অর্থাৎ database-এ কোনো পরের stage complete থাকলেও workflow order নষ্ট হবে না।

### Test 5 — Everything completed

সব required service complete হলে:

```text
readyToComplete = true
```

হবে।

### Test 6 — No work stage

শুধু:

```text
candidate
```

থাকলে:

```text
currentStage = candidate
readyToComplete = false
```

হবে।

### Test 7 — Human-readable labels

যেমন:

```text
police_clearance
```

→

```text
Police Clearance
```

এবং:

```text
null
```

→

```text
Not Started
```

---

# 7. Package.json Test Script

বর্তমানে `package.json`-এ test script নেই।

যোগ হবে:

```json
"test": "bun test"
```

তখন scripts হবে:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit",
  "test": "bun test",
  "preview": "vite preview"
}
```

---

# 8. Local Development Checks

Developer code push করার আগে:

```bash
bun run typecheck
```

তারপর:

```bash
bun run lint
```

তারপর:

```bash
bun test
```

তারপর:

```bash
bun run build
```

একসাথে:

```bash
bun run typecheck && bun run lint && bun test && bun run build
```

সব pass করলে PR তৈরি করা যাবে।

---

# 9. CI Pipeline

Current CI-তে:

```text
Typecheck
Lint
Build
```

আছে।

এতে যোগ হবে:

```text
Unit Test
```

Final CI:

```text
Install
   ↓
Typecheck
   ↓
Lint
   ↓
Unit Test
   ↓
Production Build
```

---

# 10. CI Workflow

`.github/workflows/ci.yml`

Expected workflow:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - develop
      - 'feature/**'
  pull_request:
    branches:
      - main
      - develop

permissions:
  contents: read

jobs:
  quality:
    name: Typecheck, Lint, Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Unit tests
        run: bun test

      - name: Production build
        run: bun run build
```

---

# 11. Duplicate CI Removal

বর্তমানে:

```text
ci.yml
pr-checks.yml
```

দুই জায়গায় প্রায় একই কাজ হচ্ছে।

এটা দরকার নেই।

Final architecture:

```text
ci.yml
   │
   ├── Typecheck
   ├── Lint
   ├── Test
   └── Build
```

`pr-checks.yml` remove/disable করা হবে।

এর ফলে একই PR-এর জন্য duplicate workflow run হবে না।

---

# 12. CD Pipeline

বর্তমান `cd.yml`-এ production build দুইবার run হচ্ছে।

এটা fix করতে হবে।

Final CD:

```text
main push
   ↓
Install
   ↓
Typecheck
   ↓
Lint
   ↓
Test
   ↓
Build
   ↓
Artifact
```

---

# 13. CD Production Build

Final build command:

```bash
bun run build
```

Output:

```text
dist/
```

GitHub artifact হিসেবে রাখা হবে:

```text
overseas-erp-dist
```

Retention:

```text
7 days
```

---

# 14. Vercel Deployment

Production deployment ideally:

```text
main
 ↓
Vercel
 ↓
Production
```

PR-এর জন্য:

```text
feature/*
 ↓
Pull Request
 ↓
Vercel Preview
```

অর্থাৎ production আগে:

```text
local → CI → PR → merge → production
```

এই flow follow করবে।

---

# 15. Main Branch Protection

`main` হবে protected branch।

Target:

```text
main
```

Rules:

### Require Pull Request

Direct push বন্ধ:

```text
Developer → main
```

Allowed হবে না।

বরং:

```text
Developer
 ↓
feature/*
 ↓
PR
 ↓
CI
 ↓
main
```

---

# 16. Required Status Check

`main` merge করার আগে CI pass করতে হবে।

Required check:

```text
Typecheck, Lint, Test & Build
```

CI fail করলে:

```text
Merge ❌
```

CI pass করলে:

```text
Merge ✅
```

---

# 17. Branch Must Be Up To Date

Main-এর latest code-এর সাথে PR branch update না থাকলে merge করা যাবে না।

Flow:

```text
feature branch
      +
latest main
      ↓
CI
      ↓
Merge
```

---

# 18. Force Push Protection

`main`-এ force push নিষিদ্ধ:

```bash
git push --force origin main
```

বন্ধ থাকবে।

---

# 19. Branch Deletion Protection

`main` delete করা যাবে না।

---

# 20. Conversation Resolution

PR review comment unresolved থাকলে merge বন্ধ রাখা যেতে পারে।

Recommended:

```text
Require conversation resolution
```

---

# 21. Code Review

Solo developer হলে mandatory approval না রাখলেও CI বাধ্যতামূলক রাখা যায়।

Team বড় হলে:

```text
1 approval
+
CI passed
```

require করা যাবে।

---

# 22. Dependency Security

Current:

```text
dependency-check.yml
```

আছে।

এটি চালাবে:

```bash
bun audit
```

Schedule:

```text
Weekly
```

এবং PR-তেও।

---

# 23. Dependency Lock Protection

CI-তে:

```bash
bun install --frozen-lockfile
```

ব্যবহার করা হবে।

এর অর্থ:

```text
package.json
       +
bun.lock
```

এর মধ্যে mismatch থাকলে CI fail করবে।

---

# 24. Secret Security

Repository-তে কখনো রাখা যাবে না:

```text
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PASSWORD
VERCEL_TOKEN
API_SECRET
PRIVATE_KEY
```

Frontend-এ শুধু public/anon key ব্যবহার করা যাবে যেখানে architecture অনুযায়ী safe।

Sensitive operations server-side environment-এ রাখতে হবে।

---

# 25. Supabase Security

CI/CD-এর পর সবচেয়ে গুরুত্বপূর্ণ security phase হবে Supabase।

প্রতিটি tenant-এর data isolation verify করতে হবে।

Example:

```text
Tenant A
   ↓
Candidate A

Tenant B
   ↓
Candidate B
```

Tenant A যেন কখনো Tenant B-এর:

```text
candidate
agent
finance
invoice
transaction
```

দেখতে না পারে।

---

# 26. RLS Security

Supabase tables-এ RLS verify করতে হবে।

Priority tables:

```text
tenants
profiles
candidates
agents
candidate modules
accounts
transactions
invoices
sales
```

প্রতিটি table-এর:

```text
SELECT
INSERT
UPDATE
DELETE
```

policy verify করতে হবে।

---

# 27. Multi-Tenant Security Test

Critical security requirement:

```text
user.tenant_id === record.tenant_id
```

ধারণাটি পুরো application-এ consistent থাকতে হবে।

Frontend filter security হিসেবে ধরা যাবে না।

শুধু frontend থেকে:

```ts
.eq("tenant_id", tenantId)
```

filter করে database secure ধরে নেওয়া যাবে না।

Database RLS-ও enforce করতে হবে।

---

# 28. Future Security Tests

পরবর্তী phase:

```text
RLS tests
   ↓
Tenant isolation
   ↓
Role permissions
   ↓
Auth protection
   ↓
Sensitive mutation protection
```

---

# 29. Role Security

Roles:

```text
OWNER
ADMIN
MANAGER
STAFF
```

প্রতিটি role-এর permission explicitly verify করতে হবে।

Exact permission matrix আলাদা করে define করা হবে।

---

# 30. Candidate Workflow Tests

পরবর্তীতে আরও test:

```text
Candidate creation
Candidate update
Candidate completion
Candidate return
Candidate hold
Candidate cancellation
```

এবং:

```text
Medical
MOFA
Finger
PCC
Takamul
Visa
Flight
Iqama
```

প্রতিটি stage-এর:

```text
create
update
complete
reset
freeze
```

logic test করা হবে।

---

# 31. Finance Testing

Finance module-এর জন্য critical tests:

```text
Income
Expense
Balance
Advance
Debt
Credit
Visa stock
Profit
Non-profit transaction
```

বিশেষ করে:

```text
Balance = Income - Expense
```

এবং negative balance / debit logic verify করতে হবে।

---

# 32. TanStack Query Testing

TanStack Query যোগ করার পরে test করতে হবে:

```text
Query
 ↓
Cache
 ↓
Mutation
 ↓
Invalidation
 ↓
Refetch
```

Example:

```text
Create Candidate
      ↓
Mutation
      ↓
Invalidate candidates
      ↓
Fresh query
      ↓
Updated UI
```

---

# 33. Zustand Testing

Zustand শুধু client-side UI state-এর জন্য থাকবে।

Example:

```text
sidebar
dialog
filters
selected candidate
UI preferences
```

Server state:

```text
Supabase data
```

এর জন্য:

```text
TanStack Query
```

ব্যবহার করা হবে।

---

# 34. Data Architecture

Final architecture:

```text
Supabase
   │
   ▼
TanStack Query
   │
   ├── Cache
   ├── Fetch
   ├── Mutation
   └── Invalidation
   │
   ▼
React UI

Zustand
   │
   └── Client/UI State
```

---

# 35. Test Pyramid

Project testing structure:

```text
             E2E
            /   \
       Integration
        /         \
       Unit Tests
      /             \
Business Logic + Utils
```

প্রথমে Unit test বেশি হবে।

তারপর Integration।

সবশেষে critical E2E flow।

---

# 36. E2E Testing — Future

পরবর্তীতে:

```text
Login
 ↓
Dashboard
 ↓
Candidate
 ↓
Create Candidate
 ↓
Medical
 ↓
MOFA
 ↓
Visa
 ↓
Complete
```

এই ধরনের critical user journey automated browser test করা যাবে।

---

# 37. CI/CD Final Architecture

```text
                  GitHub
                     │
                     ▼
                feature/*
                     │
                     ▼
                  Pull Request
                     │
                     ▼
              ┌───────────────┐
              │      CI       │
              ├───────────────┤
              │ Typecheck     │
              │ ESLint        │
              │ Unit Test     │
              │ Build         │
              └───────────────┘
                     │
                PASS │
                     ▼
              Protected main
                     │
                     ▼
                   Merge
                     │
                     ▼
              Production CD
                     │
                     ▼
                  Vercel
```

---

# 38. Implementation Order

আমরা একবারে সব change করব না।

## Phase 1 — Testing Foundation

```text
1. Add tests/
2. Add candidate-stage.test.ts
3. Add bun test script
4. Run bun test
```

## Phase 2 — CI

```text
5. Update ci.yml
6. Remove duplicate pr-checks.yml
7. Run GitHub Actions
8. Fix any CI errors
```

## Phase 3 — CD

```text
9. Fix cd.yml
10. Remove duplicate build
11. Add test before production build
12. Verify artifact
```

## Phase 4 — Main Protection

```text
13. Protect main
14. Require PR
15. Require CI
16. Require up-to-date branch
17. Disable force push
18. Disable deletion
```

## Phase 5 — Security

```text
19. Dependency audit
20. Secret scanning
21. Supabase RLS audit
22. Tenant isolation
23. Role permissions
24. Security tests
```

## Phase 6 — Advanced Testing

```text
25. Finance tests
26. Workflow tests
27. TanStack Query tests
28. Integration tests
29. E2E tests
```

---

# 39. Definition of Done

CI/CD foundation সম্পূর্ণ হলে:

- [ ] `bun test` works
- [ ] Candidate stage tests pass
- [ ] Typecheck passes
- [ ] ESLint passes
- [ ] Production build passes
- [ ] CI runs on PR
- [ ] Duplicate PR workflow removed
- [ ] CD duplicate build fixed
- [ ] Dependency audit runs
- [ ] `main` protected
- [ ] Direct push to main blocked
- [ ] CI required before merge
- [ ] Force push blocked
- [ ] Production deployment comes from verified main
- [ ] Supabase RLS reviewed
- [ ] Tenant isolation tested

---

# 40. Immediate Next Step

**প্রথমে শুধু Phase 1 করব।**

Project root:

```text
OverseasErp/
```

এর মধ্যে:

```text
tests/
└── candidate-stage.test.ts
```

তৈরি হবে।

তারপর `package.json`-এ:

```json
"test": "bun test"
```

যোগ হবে।

তারপর local:

```bash
bun test
```

চালাব।

**Test pass করার পরেই CI modify করব।**

এভাবে একবারে কম change করে সমস্যা isolate করা যাবে।
