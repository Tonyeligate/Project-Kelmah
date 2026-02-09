# Implementation Plan: Real-Time Job Collaboration

**Branch**: `001-real-time-collaboration` | **Date**: 2025-01-11 | **Spec**: `/specs/001-real-time-collaboration/spec.md`
**Input**: Feature specification from `/specs/001-real-time-collaboration/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (frontend + backend)
   → Structure Decision: Web application with microservices
3. Evaluate Constitution Check section below
   → All constitutional requirements met
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → All technical decisions resolved
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
6. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach
8. STOP - Ready for /tasks command
```

## Summary
Implement real-time collaboration feature for job requirements editing between hirers and workers. The system will use Socket.IO for real-time communication, integrate with existing messaging and job management services, and provide live editing, commenting, and version history capabilities.

## Technical Context
**Language/Version**: Node.js 18+, React 18, TypeScript 4.9+  
**Primary Dependencies**: Socket.IO, Express.js, MongoDB, Mongoose, Material-UI  
**Storage**: MongoDB for collaboration data, Redis for real-time state  
**Testing**: Jest, React Testing Library, Socket.IO testing utilities  
**Target Platform**: Web browsers, mobile responsive  
**Project Type**: web (frontend + backend microservices)  
**Performance Goals**: <200ms real-time update latency, support 50+ concurrent users per job  
**Constraints**: Must integrate with existing Kelmah microservices architecture  
**Scale/Scope**: 1000+ concurrent collaboration sessions, 10k+ job postings

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (collaboration-service, frontend-module)
- Using framework directly? Yes (Socket.IO, Express.js directly)
- Single data model? Yes (collaboration session model)
- Avoiding patterns? Yes (no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? Yes (collaboration-service as standalone service)
- Libraries listed: collaboration-service (real-time editing), frontend-collaboration-module (UI components)
- CLI per library: collaboration-service health checks, frontend build tools
- Library docs: API documentation and component documentation

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (tests written first)
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Socket.IO, MongoDB connections)
- Integration tests for: collaboration service, real-time updates, conflict resolution
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (Winston with JSON format)
- Frontend logs → backend? Yes (unified logging stream)
- Error context sufficient? Yes (user actions, collaboration state)

**Versioning**:
- Version number assigned? Yes (1.0.0)
- BUILD increments on every change? Yes
- Breaking changes handled? Yes (API versioning, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/001-real-time-collaboration/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application structure for Kelmah platform
kelmah-backend/
├── services/
│   └── collaboration-service/    # New microservice
│       ├── server.js
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       ├── services/
│       └── tests/
└── api-gateway/
    └── server.js                 # Updated with collaboration routes

kelmah-frontend/
├── src/
│   ├── modules/
│   │   └── collaboration/        # New frontend module
│   │       ├── components/
│   │       ├── pages/
│   │       ├── services/
│   │       ├── contexts/
│   │       └── hooks/
│   └── modules/jobs/             # Updated with collaboration features
└── tests/
```

**Structure Decision**: Web application with microservices architecture (matches existing Kelmah structure)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Real-time conflict resolution strategies
   - Socket.IO scaling patterns for collaboration
   - Integration patterns with existing messaging service
   - Version history storage and retrieval optimization

2. **Generate and dispatch research agents**:
   ```
   Task: "Research real-time collaborative editing conflict resolution strategies for web applications"
   Task: "Find best practices for Socket.IO scaling with Redis adapter for collaboration features"
   Task: "Research integration patterns between collaboration and messaging services in microservices"
   Task: "Investigate version history storage patterns for real-time collaborative documents"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - CollaborationSession entity
   - JobRequirementVersion entity
   - CollaborationComment entity
   - UserPresence entity
   - ChangeEvent entity

2. **Generate API contracts** from functional requirements:
   - WebSocket events for real-time collaboration
   - REST endpoints for collaboration management
   - Integration endpoints with job and messaging services
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per WebSocket event type
   - One test file per REST endpoint
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Real-time editing scenarios
   - Comment interaction scenarios
   - Version history scenarios
   - Conflict resolution scenarios

5. **Update agent file incrementally**:
   - Add collaboration service patterns
   - Add Socket.IO real-time patterns
   - Add conflict resolution strategies
   - Update Kelmah-specific integration patterns

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each WebSocket event → contract test task [P]
- Each REST endpoint → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Models → Services → API → Frontend
- Mark [P] for parallel execution (independent files)
- Collaboration service before frontend integration

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations - all requirements met within existing architecture*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
