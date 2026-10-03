Passport Input
      ↓
debounced check (300–500ms)
      ↓
candidate-service
      ↓
Supabase
      ↓
same tenant + passport_no?
      ↓
 ┌───────────────┐
 │               │
No              Yes
 ↓                ↓
Available      Duplicate