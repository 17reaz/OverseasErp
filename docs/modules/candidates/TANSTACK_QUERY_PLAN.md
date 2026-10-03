# TanStack Query Future Plan — OverseasErp

## 1. Goal

OverseasErp-এর server data fetching, caching, synchronization এবং mutation handling-এর জন্য TanStack Query-কে standard data layer হিসেবে ব্যবহার করা।

### Target Architecture

UI
↓
TanStack Query Hooks
↓
Service Layer
↓
Supabase
↓
Database

Local UI State
↓
Zustand

Optional Offline / Persistent Cache
↓
Dexie / IndexedDB


---

# 2. Responsibilities

## TanStack Query

TanStack Query শুধু server state manage করবে।

এর দায়িত্ব:

- Supabase data fetching
- Server-side caching
- Background refetch
- Loading state
- Error state
- Mutation state
- Cache invalidation
- Query deduplication
- Retry
- Pagination
- Prefetching
- Optimistic updates
- Server synchronization

Examples:

- Candidates
- Agents
- Agencies
- Medical records
- Visa records
- Flight records
- BMET records
- Transactions
- Invoices
- Dashboard server statistics


---

# 3. Zustand

Zustand ব্যবহার হবে client/UI state-এর জন্য।

TanStack Query-এর data Zustand-এ duplicate করা যাবে না।

### Zustand examples

- Sidebar open/close
- Selected candidate ID
- Global search state
- Active filters
- Table view preference
- Dialog open/close
- Sheet state
- User UI preferences
- Temporary form state
- Command menu state

### Rule

Server data → TanStack Query

UI state → Zustand


---

# 4. Current Phase — Candidate Queries

প্রথমে Candidate module TanStack Query-তে migrate করতে হবে।

Structure:

src/modules/erp/candidates/

```text
candidate-service.ts
candidate-types.ts
candidate-selectors.ts
stage-service.ts

hooks/
├── use-candidates.ts
├── use-candidate.ts
├── use-candidate-references.ts
└── use-candidate-mutations.ts