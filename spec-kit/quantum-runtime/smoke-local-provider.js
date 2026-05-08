#!/usr/bin/env node

const { executeOperation } = require('./runtime-service');

async function run() {
  const execution = await executeOperation({
    operation: 'apply-gate-circuit',
    payload: {
      qubits: 2,
      shots: 256,
      advantageCriteria: {
        forceQuantum: true,
      },
    },
    backendCall: {
      service: 'quantum-runtime-smoke',
      method: 'smoke-local-provider',
      operation: 'apply-gate-circuit',
    },
    taskId: 'local-qiskit-smoke',
    agent: 'copilot',
    toolName: 'local-qiskit-smoke',
  });

  const summary = {
    executionPath: execution.telemetry.executionPath,
    provider: execution.telemetry.provider,
    providerJobId: execution.telemetry.providerJobId,
    providerErrors: execution.providerErrors || [],
  };

  if (execution.telemetry.provider !== 'local-qiskit-aer') {
    console.error('Local Qiskit smoke: FAIL');
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log('Local Qiskit smoke: PASS');
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(`Local Qiskit smoke: ERROR ${error.message}`);
  process.exit(1);
});
