# OverseasErp — Scalable Architecture BPR

## 1. Document Purpose

এই BPR-এর উদ্দেশ্য হলো OverseasErp-কে এমনভাবে architect করা যাতে ভবিষ্যতে:

* লক্ষাধিক user handle করা যায়
* একই codebase Vercel, VPS এবং AWS-এ চালানো যায়
* Database scale করা যায়
* File storage আলাদা এবং scalable রাখা যায়
* Application server horizontally scale করা যায়
* CI/CD এবং automated testing ব্যবহার করা যায়
* Production security এবং reliability ধাপে ধাপে উন্নত করা যায়
* ভবিষ্যতে infrastructure পরিবর্তন করলেও application rewrite করতে না হয়

মূল principle:

> **Scale infrastructure, not the core application.**

---

# 2. Current Architecture

বর্তমান OverseasErp:

```text
React + TypeScript + Vite
            │
            ▼
        Supabase
            │
            ▼
       PostgreSQL
```

Current stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router
* Supabase
* PostgreSQL
* Bun
* GitHub
* GitHub Actions

Current deployment target:

```text
GitHub
   │
   ▼
 Vercel
```

---

# 3. Target Architecture

Long-term architecture:

```text
                         GitHub
                            │
                            ▼
                      CI / CD Pipeline
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Vercel           VPS          AWS EC2
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                     Application Layer
                         Stateless
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      PostgreSQL          Redis             Queue
       /Supabase          Cache             Worker
          │
          ├──────────────► Read Replica
          │
          └──────────────► Backup / Mirror

                            │
                            ▼
                           S3
                      File Storage
```

---

# 4. Core Architecture Principles

## 4.1 Deployment Agnostic

Application code কোনো নির্দিষ্ট hosting provider-এর ওপর depend করবে না।

একই application:

```text
Vercel
VPS
AWS EC2
```

এ চালানো যাবে।

Environment-specific configuration শুধুমাত্র environment variables / secrets-এর মাধ্যমে থাকবে।

---

# 5. Environment Configuration

Example:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Application code-এ hardcoded infrastructure credentials থাকবে না।

Deployment অনুযায়ী environment configuration পরিবর্তন হতে পারবে:

```text
Development
    ↓
.env.local

Vercel
    ↓
Vercel Environment Variables

VPS
    ↓
Server Environment Variables

AWS
    ↓
AWS Secrets / Parameter Store
```

---

# 6. Database Strategy

## Current

```text
OverseasErp
     │
     ▼
Supabase
     │
     ▼
PostgreSQL
```

Supabase বর্তমানে primary database platform হিসেবে থাকবে।

এখনই database infrastructure unnecessarily পরিবর্তন করা হবে না।

---

# 7. Future Database Architecture

Scale বাড়লে:

```text
                 PostgreSQL Primary
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
         Replica 1   Replica 2    Backup
```

Future database migration:

```text
Supabase PostgreSQL
        │
        ▼
AWS PostgreSQL / RDS
```

Application layer ideally database provider-specific implementation-এর ওপর tightly coupled থাকবে না।

---

# 8. Database Abstraction

Application architecture:

```text
React
  │
  ▼
Application Services
  │
  ▼
Data Access Layer
  │
  ▼
PostgreSQL
```

এর ফলে ভবিষ্যতে database provider পরিবর্তন করা সহজ হবে।

Business logic সরাসরি infrastructure-specific implementation-এর সঙ্গে tightly coupled করা যাবে না।

---

# 9. Multi-Tenant Architecture

OverseasErp একটি multi-tenant ERP।

Core isolation:

```text
                    Platform
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Tenant A     Tenant B     Tenant C
          │            │            │
          └────────────┼────────────┘
                       ▼
                   PostgreSQL
```

প্রধান principle:

> Every tenant-owned record must remain tenant-isolated.

Database queries, authorization এবং storage paths-এ tenant isolation বজায় রাখতে হবে।

---

# 10. File Storage Strategy

Application database-এ actual file রাখা হবে না।

Database-এ থাকবে metadata:

```text
file_id
tenant_id
candidate_id
file_name
file_type
storage_key
mime_type
file_size
uploaded_by
created_at
```

Actual files:

```text
AWS S3
```

---

# 11. S3 Storage Structure

Recommended structure:

```text
tenant/
    {tenant_id}/
        candidates/
            {candidate_id}/
                passport/
                medical/
                police-clearance/
                mofa/
                takamul/
                visa/
                flight/
                iqama/
```

Example:

```text
tenant/
    abc123/
        candidates/
            candidate456/
                passport/
                    passport-front.pdf
                    passport-back.pdf

                medical/
                    medical-report.pdf

                visa/
                    visa-copy.pdf
```

---

# 12. Secure File Upload

Frontend-এ AWS secret রাখা যাবে না।

Incorrect:

```env
VITE_AWS_ACCESS_KEY=...
VITE_AWS_SECRET_KEY=...
```

Correct architecture:

```text
Browser
   │
   ▼
Application API / Lambda
   │
   ▼
Presigned URL
   │
   ▼
S3
```

Browser temporary presigned URL ব্যবহার করে সরাসরি S3-তে file upload করবে।

---

# 13. Lambda Strategy

AWS Lambda ব্যবহার করা হবে serverless operations-এর জন্য।

Initial use case:

```text
Generate S3 Presigned URL
```

Future use cases:

* File validation
* Image processing
* PDF processing
* Thumbnail generation
* Document processing
* Metadata processing
* Notifications
* Background operations

S3 event:

```text
S3
 │
 │ ObjectCreated
 ▼
Lambda
 │
 ▼
Processing
```

---

# 14. S3 + Lambda Recursive Trigger Protection

Lambda যদি একই bucket/prefix-এ output file তৈরি করে এবং একই event আবার Lambda trigger করে, recursive invocation হতে পারে।

তাই:

```text
uploads/
    ↓
Processing Lambda
    ↓
processed/
```

অথবা আলাদা bucket ব্যবহার করা হবে।

---

# 15. Application Server Architecture

Application server হবে stateless।

Incorrect:

```text
Server
 ├── User session files
 ├── Uploaded documents
 ├── Local database
 └── Permanent application state
```

Correct:

```text
Application Server
        │
        ├── PostgreSQL
        ├── Redis
        ├── S3
        └── Queue
```

এর ফলে application instance multiple করা যাবে।

---

# 16. Horizontal Scaling

Single server:

```text
Users
  │
  ▼
App Server
```

Future:

```text
                 Load Balancer
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        App 1        App 2        App 3
```

প্রতিটি instance একই codebase চালাবে।

---

# 17. Redis Cache

High traffic হলে repeated database reads কমানোর জন্য Redis যোগ করা যাবে।

Example:

```text
User
 │
 ▼
API
 │
 ▼
Redis
 │
 ├── Cache Hit → Response
 │
 └── Cache Miss
          │
          ▼
      PostgreSQL
```

Potential cache data:

* Countries
* Permissions
* Tenant settings
* Dashboard summaries
* Frequently accessed reference data

Redis এখনই mandatory নয়।

Traffic প্রয়োজন অনুযায়ী পরে যোগ করা হবে।

---

# 18. Queue / Background Jobs

Heavy operations request-এর মধ্যে synchronousভাবে করা হবে না।

Examples:

* PDF generation
* Excel import
* Excel export
* Large reports
* Email sending
* Notifications
* Document processing
* Bulk operations

Architecture:

```text
User
 │
 ▼
API
 │
 ▼
Queue
 │
 ▼
Worker
 │
 ▼
Result
```

এতে user-facing request দ্রুত থাকে।

---

# 19. Docker Strategy

Application-কে containerized করা হবে।

Example:

```text
OverseasErp
├── src/
├── public/
├── package.json
├── bun.lock
├── Dockerfile
└── docker-compose.yml
```

Docker image ব্যবহার করে application চালানো যাবে:

```text
VPS
AWS EC2
AWS ECS
Other infrastructure
```

---

# 20. Vercel Deployment

Vercel থাকবে একটি deployment option হিসেবে।

```text
GitHub
   │
   ▼
Vercel
   │
   ▼
OverseasErp
```

Vercel deployment-এর জন্য native Vercel build/deployment ব্যবহার করা যাবে।

---

# 21. VPS Deployment

VPS-এ:

```text
GitHub
   │
   ▼
CI/CD
   │
   ▼
Docker
   │
   ▼
VPS
```

একই source code ব্যবহার হবে।

---

# 22. AWS EC2 Deployment

AWS-এ:

```text
GitHub
   │
   ▼
CI/CD
   │
   ▼
Docker
   │
   ▼
EC2
```

Application code পরিবর্তন করার প্রয়োজন হবে না।

---

# 23. CI/CD Architecture

Current CI baseline:

```text
Pull Request
     │
     ├── Tests
     ├── Typecheck
     └── Build
```

Future:

```text
Pull Request
     │
     ├── Tests
     ├── Typecheck
     ├── Lint
     ├── Security Checks
     └── Build
     │
     ▼
    main
     │
     ├──────────────┐
     ▼              ▼
  Vercel          Docker
                    │
               ┌────┴────┐
               ▼         ▼
              VPS       AWS
```

---

# 24. Testing Strategy

Testing ধাপে ধাপে বাড়ানো হবে।

## Current

```text
Unit / logic tests
Typecheck
Build
```

## Future

```text
Unit Tests
Integration Tests
API Tests
Database Tests
E2E Tests
Security Tests
```

Production deployment-এর আগে mandatory checks থাকবে।

---

# 25. Main Branch Protection

Development phase-এ branch protection optional রাখা যেতে পারে।

Production readiness-এর সময়:

```text
main
 │
 ├── Pull Request required
 ├── CI required
 ├── Tests required
 ├── Typecheck required
 ├── Build required
 ├── Force push blocked
 └── Direct deletion blocked
```

---

# 26. Security Strategy

Secrets কখনো source code বা Git repository-তে রাখা যাবে না।

Sensitive values:

```text
Supabase secrets
AWS credentials
Database passwords
API keys
JWT secrets
Third-party credentials
```

Environment/secret management ব্যবহার করতে হবে।

Deployment অনুযায়ী:

```text
Vercel Environment Variables

VPS Environment / Secret Store

AWS Secrets Manager / Parameter Store
```

---

# 27. AWS Security

AWS application-এর জন্য:

* IAM least privilege
* S3 private bucket
* No public write access
* Presigned URLs
* Separate IAM roles
* No AWS secret in frontend
* Encryption
* Access logging
* Lifecycle policies
* Backup strategy

---

# 28. Database Backup Strategy

Production-এর জন্য:

```text
Primary Database
       │
       ├── Automated Backup
       │
       ├── Point-in-Time Recovery
       │
       └── Independent Backup
```

Backup এবং mirror এক জিনিস নয়।

### Backup

```text
Database
   ↓
Backup copy
```

### Mirror / Replica

```text
Primary
   ↓
Replication
   ↓
Replica
```

---

# 29. Disaster Recovery

Future disaster recovery architecture:

```text
Primary Infrastructure
        │
        ├── Database Backup
        ├── Database Replica
        ├── S3 Versioning
        └── Application Image
```

Infrastructure failure হলে:

```text
Primary
   ↓
Failover / Restore
   ↓
Secondary Infrastructure
```

---

# 30. Observability

Scale বাড়ার সঙ্গে monitoring যোগ করতে হবে।

Track করতে হবে:

```text
Application Errors
API Latency
Database Latency
CPU
Memory
Request Rate
Error Rate
Storage
Queue Size
Cache Hit Rate
```

Future:

```text
Logs
Metrics
Tracing
Alerts
```

---

# 31. CDN

Static assets এবং public content-এর জন্য CDN ব্যবহার করা যাবে।

```text
User
 │
 ▼
CDN
 │
 ▼
Application
```

এতে global users-এর latency কমানো যাবে।

---

# 32. Scaling Roadmap

## Phase 1 — Current Development

```text
React
+
Supabase
+
GitHub
+
GitHub Actions
+
Tests
+
Typecheck
+
Build
```

Status:

```text
ACTIVE
```

---

## Phase 2 — Production Foundation

```text
Clean architecture
Environment configuration
S3
File storage abstraction
Docker
CI/CD
Security
Database backup
```

Goal:

> Production-ready foundation.

---

## Phase 3 — Application Scaling

```text
API layer
Redis
Queue
Background workers
```

Goal:

> Reduce database load and improve response time.

---

## Phase 4 — Infrastructure Scaling

```text
Load Balancer
Multiple App Instances
CDN
Read Replicas
Advanced Monitoring
```

Goal:

> Horizontal scaling.

---

## Phase 5 — Large Scale

```text
                       CDN
                        │
                        ▼
                  Load Balancer
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
        App 1         App 2         App 3
          │             │             │
          └─────────────┼─────────────┘
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
            Redis    PostgreSQL   Queue
                        │
                  ┌─────┴─────┐
                  ▼           ▼
               Replica      Backup

                         S3
                          │
                      Documents
```

---

# 33. Codebase Rule

The core application should not contain hosting-specific assumptions.

Avoid:

```text
if Vercel
if AWS
if VPS
```

inside business logic.

Instead:

```text
Application
    ↓
Interfaces / Services
    ↓
Infrastructure
```

Infrastructure can change without rewriting business logic.

---

# 34. Migration Strategy

When moving from one platform to another:

```text
Vercel
  ↓
VPS
```

or:

```text
VPS
  ↓
AWS EC2
```

only deployment configuration should change.

Application source code should remain the same.

---

# 35. Recommended Final Architecture

```text
                         GitHub
                            │
                            ▼
                      CI / CD Pipeline
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Vercel           VPS          AWS EC2
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                      Application/API
                         Stateless
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      PostgreSQL          Redis             Queue
          │                 │                 │
          │                 │                 ▼
          │                 │               Worker
          │
          ├──────────────► Read Replica
          │
          └──────────────► Backup

                            │
                            ▼
                           S3
                            │
                     Documents / Files
```

---

# 36. Core Rules

OverseasErp development-এর জন্য following rules maintain করতে হবে:

1. Core business logic unnecessarily rewrite করা যাবে না।
2. Hosting provider-specific code business logic-এ রাখা যাবে না।
3. Database credentials frontend-এ রাখা যাবে না।
4. AWS secret frontend-এ রাখা যাবে না।
5. Actual files PostgreSQL-এ রাখা যাবে না।
6. S3 bucket public write করা যাবে না।
7. Tenant isolation সব database query-তে maintain করতে হবে।
8. Application server stateless রাখতে হবে।
9. Heavy background কাজ queue/worker-এ নেওয়া হবে।
10. Production deployment-এর আগে automated tests চালাতে হবে।
11. `main` branch production-ready code-এর source হবে।
12. Infrastructure scaling-এর জন্য codebase rewrite করা যাবে না।

---

# 37. Immediate Next Steps

বর্তমানে সবকিছু একসাথে implement করা হবে না।

Recommended order:

```text
1. Testing
      ↓
2. CI
      ↓
3. Typecheck
      ↓
4. Lint cleanup
      ↓
5. Main branch protection
      ↓
6. S3 file-storage architecture
      ↓
7. Docker
      ↓
8. API abstraction
      ↓
9. Database backup
      ↓
10. Production deployment
      ↓
11. Redis
      ↓
12. Queue / Workers
      ↓
13. Load Balancer
      ↓
14. Read Replicas
      ↓
15. Advanced Monitoring
```

---

# 38. Final Goal

OverseasErp-এর লক্ষ্য হবে:

```text
                    SAME CODEBASE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Vercel           VPS            AWS
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                  Scalable Backend
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      PostgreSQL       Redis           Queue
          │
          ▼
      Replicas

                         │
                         ▼
                        S3
```

অর্থাৎ infrastructure বড় হবে, কিন্তু **OverseasErp-এর মূল codebase একই থাকবে**।

> **Build once. Deploy anywhere. Scale when needed.**
