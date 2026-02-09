# Sector Audit Entry Template

| Field | Description |
| --- | --- |
| Sector | Logical domain (e.g., Messaging Service, Frontend Jobs Module) |
| Primary File | File currently under review (absolute path from repo root) |
| Secondary Dependencies | Related files that interact directly with the primary file (routes, controllers, services, UI components, tests, configs) |
| Current Status | `Not Started`, `In Progress`, `Complete`, or `N/A` if file is deprecated |
| Issues Found | Bullet list of problems (duplication, dead code, incorrect imports, failing behaviour) |
| Required Actions | Specific code additions/removals or refactors to bring file in line with project purpose |
| Test Coverage | Existing tests touching this file, plus gaps identified |
| Notes | Additional observations, follow-up owners, external blockers |

## Usage
1. Duplicate this table for each **primary** file within a sector.
2. While auditing a primary file, append new rows for every **secondary** dependency encountered, ensuring each secondary file later receives its own primary review.
3. Record remediation tasks in `STATUS_LOG.md` and cross-link to the relevant sector audit document.
4. When a file is deprecated or replaced, document the removal rationale to prevent regressions.
