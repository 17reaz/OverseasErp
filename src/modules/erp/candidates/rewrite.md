PHASE 1
├── candidate-stage.ts
├── candidate-types.ts
└── final_status/final_reason model

PHASE 2
├── candidate-service.ts clean
├── CandidateRepository boundary
└── CandidateListItem/read model

PHASE 3
├── status selector
├── stage selector
└── sub-stage resolver

PHASE 4
├── Cancel action
├── Cancel dialog + reason
├── Reactivate
└── Return reason

PHASE 5
├── Candidate query optimization
├── lightweight CandidateReference
└── module-specific queries

PHASE 6
├── Medical → Candidate
├── MOFA → Candidate
├── Visa → Candidate
└── Flight → Candidate

PHASE 7 — later
├── Dexie
├── IndexedDB cache
└── sync/invalidation