Candidate
│
├── main_status
│      ├── active
│      ├── cancel
│      ├── complete
│      └── return
│
├── workflow_state
│      ├── processing
│      └── hold
│
├── current_stage
│      ├── medical
│      ├── mofa
│      ├── visa
│      ├── flight
│      └── iqama
│
└── validity / deadlines
       ├── medical_expires_at
       ├── mofa_expires_at
       ├── visa_expires_at
       └── iqama_due_at


                    CANDIDATE
                       │
             ┌─────────┴─────────┐
             │                   │
        MAIN STATUS         WORKFLOW ENGINE
             │                   │
    ┌────────┼────────┐          │
    │        │        │          │
 active   complete  return/cancel│
    │                            │
    ├──────────────┐             │
    │              │             │
processing        hold ◄─────────┘
    │              │
    │         hold_reason
    │
    ↓
current_stage
    │
    ↓
Pipeline

1. candidates
   └─ workflow_state + hold_reason

2. workflow-service.ts
   └─ Processing / Hold calculation

3. existing stage-service.ts
   └─ untouched

4. dashboard-service.ts
   └─ Active = Processing + Hold
   └─ Pipeline = Processing only

5. dashboard-pipeline.tsx
   └─ Hold বাদ দিয়ে processing funnel

src/modules/erp/
│
├── candidates/
│   ├── candidate-service.ts
│   ├── stage-service.ts          ← EXISTING, preserve
│   └── candidate-selectors.ts
│
├── workflow/
│   ├── workflow-service.ts       ← NEW
│   └── workflow-types.ts         ← NEW
│
├── medical/
│   └── medical-service.ts        ← workflow sync
│
├── mofa/
│   └── mofa-service.ts           ← workflow sync
│
├── visa/
│   └── visa-service.ts           ← workflow sync
│
├── flight/
│   └── flight-service.ts         ← workflow sync
│
└── dashboard/
    ├── dashboard-service.ts      ← processing/hold
    └── components/
        └── dashboard-pipeline.tsx