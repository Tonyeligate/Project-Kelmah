## Summary

Describe what changed and why.

## Task Type (Required: check exactly one)

- [ ] general
- [ ] ui-optimization
- [ ] adaptive-interface
- [ ] design-flow-optimization
- [ ] backend-optimization
- [ ] api-design-optimization
- [ ] reliability-hardening
- [ ] database-integrity-hardening
- [ ] security-hardening
- [ ] realtime-reliability
- [ ] infra-coherence

## Quantum Artifact Bundle (Required for ui-optimization, adaptive-interface, design-flow-optimization)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] layout_optimization_report.json is present
- [ ] behavioral_twin_report.json is present
- [ ] adaptive_policy_guardrails.json is present
- [ ] ui_state_space_audit.json is present
- [ ] nisq_hybrid_execution_report.json is present
- [ ] all_agent_activation_matrix.json is present
- [ ] three_d_hd_design_report.json is present

## Backend Artifact Bundle (Required for backend-optimization, api-design-optimization, reliability-hardening)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] api_topology_report.json is present
- [ ] service_reliability_report.json is present

## Database Artifact Bundle (Required for database-integrity-hardening)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] schema_drift_report.json is present
- [ ] enum_consistency_report.json is present
- [ ] query_energy_budget.json is present
- [ ] migration_safety_report.json is present

## Security Artifact Bundle (Required for security-hardening)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] attack_replay_matrix.json is present
- [ ] mitigation_effectiveness.json is present
- [ ] residual_risk_quantification.json is present

## Realtime Artifact Bundle (Required for realtime-reliability)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] event_causality_ledger.json is present
- [ ] listener_cardinality_report.json is present
- [ ] reconnect_consistency_report.json is present

## DevOps Artifact Bundle (Required for infra-coherence)

Task ID:

Bundle path:

- [ ] closure_oracle.json is present and taskType is set correctly
- [ ] delegation_packets.json includes debugger packet with verification status pass
- [ ] deployment_twin_state.json is present
- [ ] env_drift_delta.json is present
- [ ] world_verification_report.json is present

## Learning Evidence (Required for all advanced task types)

- [ ] closure_oracle.json has requiresLearningOracle=true
- [ ] learning_update.json is present
- [ ] field_experience_report.json is present

## Validation

List commands run and key results.

Recommended checks:
- `npm run quantum:pre-pr-gates -- --pr-title "<title>" --pr-body-file "<path-to-pr-body.md>" --labels-json "[]"`
- `npm run quantum:check-learning-effectiveness`
- `npm run quantum:agent-intelligence-report && npm run quantum:check-agent-intelligence`
