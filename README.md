| Priority | কাজ                                | কেন                                                         |
| -------- | ---------------------------------- | ----------------------------------------------------------- |
| 🔴 1     | **Stage Service**                  | পুরো ERP workflow-এর brain হবে                              |
| 🔴 2     | **Requested Services JSONB**       | কোন candidate কোন service নেবে সেটা define করবে             |
| 🔴 3     | **Automatic Stage Transition**     | module থেকে manual stage update কমাবে                       |
| 🔴 4     | **Status consistency**             | Visa/Flight/Medical complete হলে stage ঠিক থাকবে            |
| 🟠 5     | **RLS full audit**                 | সব table একই tenant isolation follow করছে কিনা              |
| 🟠 6     | **Tenant-wise SL standardization** | যেসব table-এ race condition আছে সব ঠিক করা                  |
| 🟠 7     | **Query optimization**             | বড় data হলে এখনকার `select`/client filtering bottleneck হবে |
| 🟡 8     | **Error handling standardization** | সব service একই error contract ব্যবহার করবে                  |
| 🟡 9     | **Audit/history**                  | কে কখন কী পরিবর্তন করেছে                                    |
| 🟡 10    | **MVP testing checklist**          | CRUD + RLS + workflow end-to-end test                       |
