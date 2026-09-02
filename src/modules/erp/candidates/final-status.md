Candidate
│
├── is_deleted = true
│   └── Deleted
│
├── is_returned = true
│   └── Returned
│
├── final_status = "cancelled"
│   └── Cancelled
│
├── final_status = "complete"
│   └── Complete
│
└── final_status IS NULL
    └── Active
        │
        ├── candidate
        ├── medical
        ├── mofa
        ├── finger
        ├── police_clearance
        ├── takamul
        ├── visa
        └── flight