                    ┌──────────────────────────┐
                    │       CORE ERP            │
                    │                          │
                    │ Medical / MOFA / Visa   │
                    │ Finger / PCC / Flight    │
                    │ Iqama / Sales / Agents  │
                    └────────────┬─────────────┘
                                 │
                                 │ Finance Event
                                 ▼
                    ┌──────────────────────────┐
                    │   FINANCE EVENT ENGINE   │
                    │                          │
                    │ Context                  │
                    │ Validator                │
                    │ Idempotency              │
                    │ Registry                 │
                    │ Mapper                   │
                    │ Service                  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      FINANCE CORE        │
                    │                          │
                    │ Transaction Groups       │
                    │ Transactions             │
                    │ Accounts                 │
                    │ Categories               │
                    │ Parties                  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      REPORTING           │
                    │                          │
                    │ Profit / Loss            │
                    │ Receivable / Payable     │
                    │ Party Balance            │
                    │ Cash / Bank              │
                    │ Service Cost             │
                    └──────────────────────────┘