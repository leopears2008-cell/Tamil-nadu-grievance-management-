# Production Upgrade Set

Implemented in the current platform:

1. **AI evaluation** — golden complaint cases, department/priority accuracy, prompt-injection detection, hallucination guard, and retrieval precision/recall/F1 helpers.
2. **Workflow testing** — deterministic citizen/authority lifecycle transition tests plus API-level authorization boundaries for officer work.
3. **Observability** — request IDs, structured request logging (opt-in), latency/error counters, memory/uptime snapshot, and protected admin observability endpoint.
4. **Grievance intelligence** — deterministic department routing, severity/SLA recommendation, token/Jaccard duplicate scoring, and a protected intelligence endpoint. Recommendations do not silently change a grievance.
5. **Authority workflow** — Firebase-verified officer identity linking, officer-scoped queues, ownership checks, controlled status transitions, escalation records, HTTPS resolution evidence, and citizen resolution verification/reopen.
6. **News** — Google News RSS remains isolated behind the backend adapter. The UI shows attribution and links to original publishers. A provider adapter boundary is documented for a licensed production news service.
7. **Security** — request IDs, configurable proxy trust, strict JSON parsing/size limits, stronger rate-limit posture, verified staff access, anti-spoofed officer identity, workflow transition enforcement, HTTPS evidence validation, and decoded image signature/size validation.

## Operational requirements

- Run the authority migration before enabling officer accounts.
- Link each real officer to a verified Firebase account through the protected admin endpoint.
- Do not present AI department/severity/SLA output as an official decision without staff verification.
- Use private object storage and malware scanning before accepting large-scale evidence uploads.
- Use a shared rate-limit store when deploying multiple server replicas.
- Configure an approved/licensed news provider for commercial redistribution if Google News RSS usage is not permitted for the intended deployment.
- Populate reviewed production departments/officers; do not use hard-coded demo identities.
