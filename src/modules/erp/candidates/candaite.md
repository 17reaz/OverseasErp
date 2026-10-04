# OverseasErp

## Candidate Module Centralization & Architecture BPR

**Document Type:** Business / Technical Process Requirement
**Module:** Candidates
**Status:** Proposed Architecture
**Goal:** Centralized Candidate Engine + Thin Candidate UI
**Primary Principle:** `candidates-page.tsx` should know **what** to display, not **how** candidate data or workflow is calculated.

---

# 1. Objective

বর্তমানে Candidate module-এর responsibility অনেকগুলো file-এর মধ্যে ছড়িয়ে আছে:

* Candidate data fetching
* Supabase query
* Dexie cache
* Candidate sync
* Workflow calculation
* Stage logic
* Status logic
* Candidate mutations
* Candidate actions
* References
* UI state

এর ফলে একটি ছোট feature change করতেও একাধিক জায়গায় change করতে হয়।

এই architecture-এর লক্ষ্য:

> Candidate module-এর core business logic এবং data logic একটি centralized architecture-এর মাধ্যমে পরিচালনা করা এবং `candidates-page.tsx`-কে একটি stable UI consumer হিসেবে lock করা।

---

# 2. Current Problem

বর্তমান structure:

```text
candidates/
├── candidate-actions.ts
├── candidate-cache-loader.ts
├── candidate-data-engine.ts
├── candidate-query.ts
├── candidate-selectors.ts
├── candidate-service.ts
├── candidate-status.ts
├── candidate-sync.ts
├── candidate-types.ts
├── candidates-page.tsx
└── stage-service.ts
```

এখানে responsibility overlap করার সম্ভাবনা আছে।

উদাহরণ:

```text
candidates-page.tsx
       │
       ├── cache loader
       ├── workflow service
       ├── candidate service
       ├── sync
       ├── local state
       └── business rules
```

এটা দীর্ঘমেয়াদে maintain করা কঠিন।

---

# 3. Target Architecture

Target architecture:

```text
                         UI
                          │
                          ▼
                 candidates-page.tsx
                          │
                          ▼
                  React Hooks Layer
                          │
                          ▼
                  Candidate Engine
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      Candidate Repository       Workflow Engine
             │                         │
       ┌─────┴─────┐                   │
       │           │                   │
       ▼           ▼                   ▼
   Supabase      Dexie           Stage / Status
       │           │
       └─────┬─────┘
             ▼
        Sync / Cache
```

---

# 4. Core Architectural Rule

## Candidate Page Must NOT Own Business Logic

`candidates-page.tsx` শুধুমাত্র:

* UI state
* Search
* Filter
* Sort
* View mode
* Dialog open/close
* User interaction
* Data rendering

handle করবে।

### Candidate page জানবে না:

* Medical validity কতদিন
* MOFA validity
* Visa expiry calculation
* Flight হলে Iqama কেন pending
* কোন stage active
* Stage transition rules
* Workflow calculation
* Supabase query structure
* Dexie implementation
* Cache strategy
* Sync strategy
* Tenant resolution
* Background refresh

---

# 5. Candidate Page Contract

Candidate page-এর জন্য একটি stable contract থাকবে।

Page ideally এমন API ব্যবহার করবে:

```ts
candidateEngine.list()
candidateEngine.get(id)

candidateEngine.create(payload)
candidateEngine.update(id, payload)
candidateEngine.delete(id)

candidateEngine.restore(id)
candidateEngine.returnCandidate(id)

candidateEngine.refresh()
```

Future-এ internal implementation পরিবর্তন হলেও page-এর API পরিবর্তন করা হবে না।

---

# 6. Candidate Engine

Candidate Engine হবে module-এর primary orchestration layer।

Proposed:

```text
candidate-engine.ts
```

এর responsibility:

1. Candidate read orchestration
2. Candidate write orchestration
3. Cache strategy
4. Repository interaction
5. Workflow calculation
6. Returned/deleted candidate handling
7. Future sync integration
8. Future offline queue integration

---

# 7. Candidate Engine API

প্রাথমিক API:

```ts
candidateEngine.list()
candidateEngine.get(id)

candidateEngine.create(payload)
candidateEngine.update(id, payload)
candidateEngine.delete(id)

candidateEngine.restore(id)
candidateEngine.returnCandidate(id)

candidateEngine.refresh()
candidateEngine.sync()
```

Future API:

```ts
candidateEngine.loadNextBatch()
candidateEngine.search()
candidateEngine.prefetch()
candidateEngine.invalidate()
```

কিন্তু এগুলো প্রয়োজন হওয়ার আগে implement করা হবে না।

---

# 8. Candidate Repository

Repository-এর কাজ হবে data access।

Proposed:

```text
candidate-repository.ts
```

Repository জানবে:

* Supabase
* Dexie
* Database query
* Local cache persistence

কিন্তু Repository জানবে না:

* UI
* React
* Dialog
* Page
* Visual stage badge
* Business presentation

---

# 9. Repository Responsibilities

Repository API:

```ts
list()
get(id)

create(data)
update(id, data)
delete(id)

saveCache(data)
getCache()
clearCache()
```

Future:

```ts
listBatch(cursor)
syncChanges()
queueMutation()
```

---

# 10. Data Source Separation

Data source hierarchy:

```text
Supabase
   │
   │ source of truth
   ▼
Candidate Repository
   │
   ├── Dexie
   │
   └── UI
```

Supabase থাকবে authoritative server database হিসেবে।

Dexie থাকবে local persistence/cache হিসেবে।

---

# 11. Dexie Responsibility

Dexie-এর কাজ:

* Local candidate persistence
* Offline read
* Fast initial render
* Background refresh-এর জন্য local storage
* Future offline mutation queue

Dexie business logic করবে না।

Dexie কখনো decide করবে না:

```text
"Candidate এখন Visa stage-এ"
```

এটা Workflow Engine-এর দায়িত্ব।

---

# 12. Candidate Workflow Engine

Workflow logic centralize করতে হবে।

Proposed:

```text
workflow/
├── workflow-engine.ts
├── workflow-rules.ts
├── workflow-stage.ts
└── workflow-types.ts
```

---

# 13. Workflow Engine Responsibility

Workflow Engine determine করবে:

```text
Candidate-এর current stage কী?
Candidate-এর workflow status কী?
Candidate hold-এ কেন?
Candidate next stage-এ আছে কিনা?
কোন stage expired?
কোন stage pending?
```

---

# 14. Candidate Workflow

বর্তমান workflow:

```text
Medical
   ↓
MOFA
   ↓
Finger
   ↓
PCC
   ↓
Takamul
   ↓
Visa
   ↓
BMET / Manpower
   ↓
Flight
   ↓
Iqama
```

এই chain-এর business rules এক জায়গায় থাকবে।

---

# 15. Workflow Example

Candidate page কখনো এমন logic লিখবে না:

```ts
if (visaDate && flightDate) {
   // Iqama
}
```

বরং:

```ts
const workflow = workflowEngine.resolve(candidate);
```

Result:

```ts
{
  stage: "iqama",
  status: "pending",
  reason: null
}
```

Page শুধু:

```tsx
<CandidateStageBadge
  stage={candidate.workflow.stage}
/>
```

render করবে।

---

# 16. Workflow Rules

Workflow rules আলাদা রাখা হবে।

উদাহরণ:

```text
workflow-rules.ts
```

এখানে থাকবে:

```text
Medical validity
MOFA validity
Visa validity
Flight state
Iqama state
Returned state
Hold state
Final state
```

---

# 17. Status Separation

Candidate status এবং workflow stage একই জিনিস নয়।

### Stage

```text
Medical
MOFA
Finger
PCC
Takamul
Visa
BMET
Flight
Iqama
```

### Overall Status

```text
Active
Returned
Complete
Hold
Cancelled
```

এই দুইটা আলাদা domain concept হিসেবে থাকবে।

---

# 18. Candidate View Model

Database Candidate এবং UI Candidate এক জিনিস হওয়া বাধ্যতামূলক নয়।

Future target:

```ts
type CandidateView = {
  id: string;
  sl: number | null;
  name: string | null;
  passport_no: string | null;

  workflow: {
    stage: CandidateStage;
    status: string;
    label: string;
    reason: string | null;
  };

  status: CandidateOverallStatus;

  agent: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;
};
```

এর সুবিধা:

Database structure change হলেও UI contract stable রাখা যায়।

---

# 19. Hooks Layer

Existing hooks থাকবে:

```text
hooks/
├── use-candidates.ts
├── use-candidate.ts
├── use-candidate-mutations.ts
└── use-candidate-references.ts
```

কিন্তু hooks-এর মধ্যে business logic থাকবে না।

Hook হবে orchestration adapter।

Example:

```ts
useCandidates()
    ↓
candidateEngine.list()
```

---

# 20. Candidate Page

Final target:

```text
candidates-page.tsx
```

এর responsibility:

```text
UI
├── Search
├── Filter
├── Sort
├── View
├── Dialog
├── Selection
└── Rendering
```

এগুলো ছাড়া অন্য logic যতটা সম্ভব বাইরে থাকবে।

---

# 21. Candidate Page Forbidden Responsibilities

`candidates-page.tsx`-এ future-এ নিচেরগুলো রাখা যাবে না:

```text
❌ Supabase query
❌ Dexie query
❌ Cache implementation
❌ Sync implementation
❌ Workflow calculation
❌ Stage calculation
❌ Expiry calculation
❌ Tenant resolution
❌ Database mutation
❌ Complex business rule
❌ Data transformation logic
```

---

# 22. Candidate Page Allowed Responsibilities

```text
✅ Search state
✅ Filter state
✅ Sort state
✅ UI state
✅ Dialog state
✅ Grid/Table selection
✅ Calling hooks
✅ Rendering data
```

---

# 23. Candidate Mutation Flow

Create:

```text
Form
 ↓
useCandidateMutations
 ↓
candidateEngine.create()
 ↓
candidateRepository.create()
 ↓
Supabase
 ↓
Dexie update
 ↓
UI
```

Update:

```text
UI
 ↓
Mutation Hook
 ↓
Candidate Engine
 ↓
Repository
 ↓
Supabase
 ↓
Dexie
 ↓
UI refresh/update
```

---

# 24. Delete Flow

```text
Delete Dialog
      ↓
Mutation Hook
      ↓
Candidate Engine
      ↓
Repository
      ↓
Supabase
      ↓
Dexie
      ↓
UI
```

Delete behavior এবং soft-delete rules centralized থাকবে।

---

# 25. Returned Candidate Flow

Returned candidate logic:

```text
UI
 ↓
candidateEngine.returnCandidate()
 ↓
business action
 ↓
repository mutation
 ↓
cache update
 ↓
workflow recalculation
```

Page return logic জানবে না।

---

# 26. Restore Flow

```text
UI
 ↓
candidateEngine.restore()
 ↓
Candidate Action
 ↓
Repository
 ↓
Supabase
 ↓
Dexie
```

---

# 27. Candidate Actions

`candidate-actions.ts` থাকবে domain-level actions-এর জন্য।

Possible actions:

```text
returnCandidate()
restoreCandidate()
reactivateCandidate()
cancelCandidate()
completeCandidate()
holdCandidate()
```

তবে Action এবং Engine-এর boundary clear রাখতে হবে।

### Engine

Orchestration করবে।

### Action

Business operation define করবে।

---

# 28. Query Layer

`candidate-query.ts` থাকবে database query definition-এর জন্য।

যেমন:

```ts
CANDIDATE_SELECT
```

এখানে UI logic থাকবে না।

Query structure পরিবর্তন হলেও page untouched থাকবে।

---

# 29. Tenant Isolation

Tenant security অত্যন্ত গুরুত্বপূর্ণ।

Target rule:

```text
Current Auth User
       ↓
Tenant Context
       ↓
Repository
       ↓
Supabase RLS
       ↓
Tenant Data
```

Frontend `.eq("tenant_id", tenantId)` security boundary নয়।

Final security boundary:

```text
Supabase RLS
```

---

# 30. Tenant Cache Isolation

Dexie cache tenant scoped হবে।

Concept:

```text
Tenant A
 ├── Candidate A1
 └── Candidate A2

Tenant B
 ├── Candidate B1
 └── Candidate B2
```

Tenant A-এর cache Tenant B-এর UI-তে কখনো render করা যাবে না।

Cache query:

```ts
getCachedCandidates(tenantId)
```

tenant scoped হতে হবে।

---

# 31. Logout Behavior

Dexie browser storage persistent।

অর্থাৎ:

```text
Logout
   ≠
IndexedDB automatically cleared
```

তাই architecture-এ logout/cache policy explicit করতে হবে।

Recommended:

```text
Logout
 ↓
Auth session cleared
 ↓
Active tenant cache policy applied
```

Future decision:

```text
Option A:
Clear active tenant cache

Option B:
Keep cache but never expose wrong tenant

Option C:
Clear all local ERP cache
```

এই decision implementation-এর আগে lock করতে হবে।

---

# 32. Cache Strategy

প্রাথমিক target:

```text
Page Open
   ↓
Dexie
   ↓
Data exists?
   ├── YES → UI immediately
   │           ↓
   │      background refresh
   │
   └── NO → Supabase
               ↓
             Dexie
               ↓
              UI
```

---

# 33. Background Refresh

যদি cache পাওয়া যায়:

```text
Dexie
 ↓
UI
```

এর পাশাপাশি:

```text
Supabase
 ↓
Fresh Data
 ↓
Dexie
```

UI block করা যাবে না।

---

# 34. Duplicate Refresh Prevention

একই সময়ে multiple refresh হলে duplicate network request avoid করতে হবে।

Future engine:

```ts
backgroundRefreshPromise
```

বা equivalent request deduplication ব্যবহার করবে।

---

# 35. Batch Loading

বর্তমানে সব candidate একসাথে load করার architecture long-term target নয়।

Future:

```text
Batch 1
 ↓
UI

Batch 2
 ↓
UI

Batch 3
 ↓
UI
```

Example:

```text
100 candidates
100 candidates
100 candidates
...
```

কিন্তু batch loading এখনই implement করা হবে না।

প্রথমে architecture boundary stable করা হবে।

---

# 36. Future Worker Support

Heavy processing ভবিষ্যতে Worker-এ নেওয়া যাবে।

Possible:

```text
Candidate Engine
      ↓
Worker
      ↓
Workflow calculation
      ↓
Result
      ↓
UI
```

এতে main thread block হবে না।

Page architecture পরিবর্তন করতে হবে না।

---

# 37. Future TanStack Query

TanStack Query future-এ engine-এর নিচে বসতে পারবে।

Target:

```text
Page
 ↓
Hook
 ↓
Candidate Engine
 ↓
TanStack Query
 ↓
Repository
 ↓
Dexie / Supabase
```

Page-এ TanStack Query-specific business logic থাকবে না।

---

# 38. Future Hono

Complex server-side query future-এ:

```text
Candidate Engine
       ↓
Repository
       ↓
Hono
       ↓
Supabase
```

অথবা simple CRUD:

```text
Candidate Repository
       ↓
Supabase
```

Complex query-এর জন্য Hono যোগ করা যাবে।

Page touch করতে হবে না।

---

# 39. Future Realtime

Realtime এখন architecture-এর অংশ হিসেবে রাখা হবে, কিন্তু এখন implement করা হবে না।

Future:

```text
Supabase Realtime
       ↓
Sync Layer
       ↓
Dexie
       ↓
Candidate Engine
       ↓
UI
```

Page সরাসরি realtime subscription করবে না।

---

# 40. Final Folder Structure

Final target structure:

```text
candidates/
│
├── candidates-page.tsx
│
├── components/
│   ├── candidate-cancel-dialog.tsx
│   ├── candidate-delete-dialog.tsx
│   ├── candidate-filters.tsx
│   ├── candidate-form-dialog.tsx
│   ├── candidate-form.tsx
│   ├── candidate-passport-dialog.tsx
│   ├── candidate-return-dialog.tsx
│   ├── candidate-stage-badge.tsx
│   ├── candidate-stage.tsx
│   ├── candidate-toolbar.tsx
│   ├── candidates-grid.tsx
│   └── candidates-table.tsx
│
├── hooks/
│   ├── use-candidates.ts
│   ├── use-candidate.ts
│   ├── use-candidate-mutations.ts
│   └── use-candidate-references.ts
│
├── engine/
│   ├── candidate-engine.ts
│   ├── candidate-repository.ts
│   ├── candidate-cache.ts
│   └── candidate-sync.ts
│
├── domain/
│   ├── candidate-types.ts
│   ├── candidate-status.ts
│   │
│   └── workflow/
│       ├── workflow-engine.ts
│       ├── workflow-rules.ts
│       ├── workflow-stage.ts
│       └── workflow-types.ts
│
├── services/
│   ├── candidate-service.ts
│   ├── candidate-actions.ts
│   ├── candidate-files-service.ts
│   └── candidate-passport-upload.tsx
│
├── queries/
│   └── candidate-query.ts
│
└── profile/
    ├── candidate-profile-page.tsx
    ├── info-card.tsx
    ├── module-configs.tsx
    ├── module-records-panel.tsx
    ├── module-records-sheet.tsx
    ├── processing-stepper.tsx
    ├── qr-card.tsx
    ├── status-service.tsx
    ├── timeline-card.tsx
    └── types.ts
```

---

# 41. Important: Folder Move Is Not Step 1

Physical folder restructuring প্রথম কাজ নয়।

প্রথমে responsibility ঠিক করতে হবে।

Migration order:

```text
Step 1
Existing code audit
       ↓
Step 2
Responsibility map
       ↓
Step 3
Candidate Engine
       ↓
Step 4
Repository boundary
       ↓
Step 5
Workflow Engine
       ↓
Step 6
Move page logic out
       ↓
Step 7
Lock candidates-page.tsx
       ↓
Step 8
Physical folder cleanup
```

---

# 42. Migration Rule

Migration-এর সময় existing behavior পরিবর্তন করা যাবে না।

অর্থাৎ:

```text
Architecture change
       ≠
Feature change
```

প্রথম phase-এ লক্ষ্য:

```text
Same behavior
+
Better architecture
```

---

# 43. No Big-Bang Rewrite

পুরো Candidate module একসাথে rewrite করা হবে না।

একবারে একটি boundary।

Recommended sequence:

### Phase 1

Candidate Engine

### Phase 2

Repository

### Phase 3

Workflow Engine

### Phase 4

Page cleanup

### Phase 5

Mutation cleanup

### Phase 6

Cache cleanup

### Phase 7

Folder cleanup

---

# 44. Testing Strategy

Core business logic UI থেকে আলাদা হওয়ায় test সহজ হবে।

Workflow tests:

```text
Medical valid
Medical expired
MOFA active
Visa active
Visa + Flight
Flight + Iqama pending
Returned candidate
Hold candidate
Complete candidate
```

Repository tests:

```text
Tenant isolation
Cache read
Cache write
Create
Update
Delete
```

Engine tests:

```text
Cache-first
Database fallback
Background refresh
Mutation synchronization
```

---

# 45. Candidate Page Testing

Page test শুধু UI behavior test করবে:

```text
Candidate list renders
Search works
Filter works
Sort works
Dialog opens
Create action called
Update action called
Delete action called
```

Page test-এর মধ্যে workflow calculation test করা হবে না।

---

# 46. Architecture Lock Rules

Candidate page lock করার পর:

### Allowed

```text
UI redesign
New filter
New column
New dialog
New view
New presentation
```

### Not allowed

```text
Direct Supabase query
Direct Dexie query
Workflow logic
Cache logic
Sync logic
Tenant resolution
Database business logic
```

---

# 47. Definition of Done

Candidate architecture complete ধরা হবে যখন:

* [ ] Candidate Engine exists
* [ ] Candidate Repository exists
* [ ] Workflow Engine exists
* [ ] Stage rules centralized
* [ ] Status rules centralized
* [ ] Supabase access centralized
* [ ] Dexie access centralized
* [ ] Candidate page has no business logic
* [ ] Candidate page has no direct database access
* [ ] Candidate page has no workflow calculation
* [ ] Candidate page only consumes stable APIs
* [ ] Tenant isolation is preserved
* [ ] Cache remains tenant-scoped
* [ ] Existing features continue working
* [ ] Tests pass
* [ ] Typecheck passes
* [ ] Build passes

---

# 48. Final Principle

এই module-এর সবচেয়ে important architectural rule:

> **UI should ask for a result, not calculate the result.**

Example:

Bad:

```ts
if (visaExpired && flightCompleted && !iqamaCompleted) {
  stage = "iqama";
}
```

Good:

```ts
const workflow = candidateEngine.getWorkflow(candidate);
```

তারপর UI:

```tsx
workflow.stage
workflow.status
workflow.reason
```

---

# 49. Final Target

শেষে Candidate module এমন হবে:

```text
                 CANDIDATE UI
                      │
                      ▼
                React Hooks
                      │
                      ▼
              CANDIDATE ENGINE
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
     REPOSITORY             WORKFLOW ENGINE
          │                       │
      ┌───┴───┐             ┌─────┴─────┐
      ▼       ▼             ▼           ▼
 Supabase   Dexie         Stage       Status
      │       │             │           │
      └───┬───┘             └─────┬─────┘
          │                       │
          └──────────┬────────────┘
                     ▼
              Candidate Result
                     │
                     ▼
                    UI
```

## End Result

`candidates-page.tsx` শুধু জানবে:

> **"এই candidate-এর data কী?"**

এবং:

> **"এই candidate-এর current stage/status কী?"**

কিন্তু **কেন সেই stage/status হলো সেটা জানবে না।**

এটাই Candidate module-এর final architectural boundary।
