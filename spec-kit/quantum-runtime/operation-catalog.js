const PROVIDERS = Object.freeze([
  'local-qiskit-aer',
  'ibm-quantum',
  'aws-braket',
  'azure-quantum',
  'd-wave',
  'classical-simulator',
]);

const OPERATION_CATALOG = Object.freeze({
  'prepare-qubit-state': {
    label: 'Prepare qubit states',
    workloadType: 'state-preparation',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'apply-gate-circuit': {
    label: 'Apply gate circuits',
    workloadType: 'gate-evaluation',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'exploit-interference': {
    label: 'Exploit interference',
    workloadType: 'interference-analysis',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'measure-output': {
    label: 'Measure outputs',
    workloadType: 'measurement',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'surface-code-error-correction': {
    label: 'Quantum error correction (surface code style)',
    workloadType: 'error-correction',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'logical-qubit-fault-tolerant-execution': {
    label: 'Logical qubits and fault-tolerant execution',
    workloadType: 'fault-tolerant',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'vqe-optimization': {
    label: 'Hybrid Variational Quantum Eigensolver (VQE)',
    workloadType: 'hybrid-optimization',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'qaoa-optimization': {
    label: 'Hybrid Quantum Approximate Optimization Algorithm (QAOA)',
    workloadType: 'hybrid-optimization',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'shor-factorization': {
    label: 'Shor factorization',
    workloadType: 'specialized-algorithm',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'grover-search': {
    label: 'Grover search',
    workloadType: 'specialized-algorithm',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'amplitude-estimation': {
    label: 'Amplitude estimation',
    workloadType: 'specialized-algorithm',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'phase-estimation': {
    label: 'Phase estimation',
    workloadType: 'specialized-algorithm',
    providerPreference: ['ibm-quantum', 'azure-quantum', 'aws-braket'],
    quantumComputing: true,
  },
  'chemistry-materials-simulation': {
    label: 'Large-scale simulation for chemistry and materials',
    workloadType: 'chemistry-materials',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum'],
    quantumComputing: true,
  },
  'annealing-optimization': {
    label: 'Quantum annealing optimization',
    workloadType: 'annealing',
    providerPreference: ['d-wave', 'aws-braket'],
    quantumComputing: true,
  },
  'hybrid-quantum-workflow': {
    label: 'Hybrid quantum workflow',
    workloadType: 'hybrid-workflow',
    providerPreference: ['ibm-quantum', 'aws-braket', 'azure-quantum', 'd-wave'],
    quantumComputing: true,
  },
  'classical-orchestration': {
    label: 'Classical orchestration operation',
    workloadType: 'classical',
    providerPreference: ['classical-simulator'],
    quantumComputing: false,
  },
});

const QUANTUM_COMPUTING_OPERATIONS = new Set(
  Object.entries(OPERATION_CATALOG)
    .filter(([, meta]) => meta.quantumComputing === true)
    .map(([operation]) => operation),
);

module.exports = {
  PROVIDERS,
  OPERATION_CATALOG,
  QUANTUM_COMPUTING_OPERATIONS,
};
