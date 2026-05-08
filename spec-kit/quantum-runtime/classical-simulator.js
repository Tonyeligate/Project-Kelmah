const TWO_PI = Math.PI * 2;

function complex(re, im = 0) {
  return { re, im };
}

function cAdd(a, b) {
  return complex(a.re + b.re, a.im + b.im);
}

function cMul(a, b) {
  return complex(
    (a.re * b.re) - (a.im * b.im),
    (a.re * b.im) + (a.im * b.re),
  );
}

function cAbs2(a) {
  return (a.re * a.re) + (a.im * a.im);
}

function cScale(a, scalar) {
  return complex(a.re * scalar, a.im * scalar);
}

function toComplex(value) {
  if (value && typeof value === 'object' && typeof value.re === 'number') {
    return complex(value.re, Number.isFinite(value.im) ? value.im : 0);
  }
  if (typeof value === 'number') {
    return complex(value, 0);
  }
  return complex(0, 0);
}

function normalizeState(state) {
  const normSquared = state.reduce((acc, amp) => acc + cAbs2(amp), 0);
  if (normSquared <= 0) {
    return state;
  }
  const invNorm = 1 / Math.sqrt(normSquared);
  return state.map((amp) => cScale(amp, invNorm));
}

function createZeroState(qubits) {
  const size = 1 << qubits;
  const state = Array.from({ length: size }, () => complex(0, 0));
  state[0] = complex(1, 0);
  return state;
}

function createPrng(seedInput) {
  const seedString = String(seedInput || 'kelmah-quantum-runtime');
  let seed = 2166136261;
  for (let i = 0; i < seedString.length; i += 1) {
    seed ^= seedString.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gateMatrix(type, params = {}) {
  const theta = Number.isFinite(params.theta) ? params.theta : 0;
  const halfTheta = theta / 2;

  switch (String(type || '').toUpperCase()) {
    case 'H': {
      const v = 1 / Math.sqrt(2);
      return [
        [complex(v, 0), complex(v, 0)],
        [complex(v, 0), complex(-v, 0)],
      ];
    }
    case 'X':
      return [
        [complex(0, 0), complex(1, 0)],
        [complex(1, 0), complex(0, 0)],
      ];
    case 'Y':
      return [
        [complex(0, 0), complex(0, -1)],
        [complex(0, 1), complex(0, 0)],
      ];
    case 'Z':
      return [
        [complex(1, 0), complex(0, 0)],
        [complex(0, 0), complex(-1, 0)],
      ];
    case 'S':
      return [
        [complex(1, 0), complex(0, 0)],
        [complex(0, 0), complex(0, 1)],
      ];
    case 'T': {
      const angle = Math.PI / 4;
      return [
        [complex(1, 0), complex(0, 0)],
        [complex(0, 0), complex(Math.cos(angle), Math.sin(angle))],
      ];
    }
    case 'RX': {
      const c = Math.cos(halfTheta);
      const s = Math.sin(halfTheta);
      return [
        [complex(c, 0), complex(0, -s)],
        [complex(0, -s), complex(c, 0)],
      ];
    }
    case 'RY': {
      const c = Math.cos(halfTheta);
      const s = Math.sin(halfTheta);
      return [
        [complex(c, 0), complex(-s, 0)],
        [complex(s, 0), complex(c, 0)],
      ];
    }
    case 'RZ': {
      return [
        [complex(Math.cos(-halfTheta), Math.sin(-halfTheta)), complex(0, 0)],
        [complex(0, 0), complex(Math.cos(halfTheta), Math.sin(halfTheta))],
      ];
    }
    default:
      return [
        [complex(1, 0), complex(0, 0)],
        [complex(0, 0), complex(1, 0)],
      ];
  }
}

function applySingleQubitGate(state, qubits, target, matrix) {
  const size = 1 << qubits;
  const mask = 1 << target;

  for (let i = 0; i < size; i += 1) {
    if ((i & mask) !== 0) {
      continue;
    }

    const j = i | mask;
    const amp0 = state[i];
    const amp1 = state[j];

    const next0 = cAdd(cMul(matrix[0][0], amp0), cMul(matrix[0][1], amp1));
    const next1 = cAdd(cMul(matrix[1][0], amp0), cMul(matrix[1][1], amp1));

    state[i] = next0;
    state[j] = next1;
  }
}

function applyCnotGate(state, qubits, control, target) {
  const size = 1 << qubits;
  const controlMask = 1 << control;
  const targetMask = 1 << target;

  for (let i = 0; i < size; i += 1) {
    if ((i & controlMask) === 0 || (i & targetMask) !== 0) {
      continue;
    }

    const j = i | targetMask;
    const tmp = state[i];
    state[i] = state[j];
    state[j] = tmp;
  }
}

function applyControlledZGate(state, qubits, control, target) {
  const size = 1 << qubits;
  const controlMask = 1 << control;
  const targetMask = 1 << target;

  for (let i = 0; i < size; i += 1) {
    if ((i & controlMask) !== 0 && (i & targetMask) !== 0) {
      state[i] = cScale(state[i], -1);
    }
  }
}

function toBitString(index, qubits) {
  return index.toString(2).padStart(qubits, '0');
}

function toProbabilityDistribution(state) {
  const probabilities = state.map((amp) => cAbs2(amp));
  const sum = probabilities.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    return probabilities;
  }
  return probabilities.map((value) => value / sum);
}

function sampleFromProbabilities(probabilities, shots, qubits, prng) {
  const cumulative = [];
  let running = 0;
  for (let i = 0; i < probabilities.length; i += 1) {
    running += probabilities[i];
    cumulative.push(running);
  }

  const counts = {};
  for (let s = 0; s < shots; s += 1) {
    const r = prng();
    let index = cumulative.findIndex((value) => value >= r);
    if (index < 0) {
      index = cumulative.length - 1;
    }
    const bitString = toBitString(index, qubits);
    counts[bitString] = (counts[bitString] || 0) + 1;
  }

  return counts;
}

function decodeInitialState(payload, qubits) {
  if (Array.isArray(payload.initialState) && payload.initialState.length > 0) {
    const size = 1 << qubits;
    const base = Array.from({ length: size }, () => complex(0, 0));
    for (let i = 0; i < Math.min(payload.initialState.length, size); i += 1) {
      base[i] = toComplex(payload.initialState[i]);
    }
    return normalizeState(base);
  }

  switch (String(payload.statePreset || '').toLowerCase()) {
    case 'plus': {
      const size = 1 << qubits;
      const amp = 1 / Math.sqrt(size);
      return Array.from({ length: size }, () => complex(amp, 0));
    }
    case 'bell': {
      if (qubits < 2) {
        return createZeroState(qubits);
      }
      const bell = createZeroState(qubits);
      bell[0] = complex(1 / Math.sqrt(2), 0);
      bell[3] = complex(1 / Math.sqrt(2), 0);
      return bell;
    }
    default:
      return createZeroState(qubits);
  }
}

function simulateCircuit(payload = {}) {
  const qubits = Math.max(1, Math.min(10, Number(payload.qubits) || 2));
  const state = decodeInitialState(payload, qubits);
  const circuit = Array.isArray(payload.circuit) ? payload.circuit : [];

  let depth = 0;
  for (const gate of circuit) {
    if (!gate || typeof gate !== 'object') {
      continue;
    }

    const type = String(gate.type || '').toUpperCase();
    if (type === 'CNOT') {
      const control = Number.isInteger(gate.control) ? gate.control : 0;
      const target = Number.isInteger(gate.target) ? gate.target : 1;
      if (control !== target && control >= 0 && target >= 0 && control < qubits && target < qubits) {
        applyCnotGate(state, qubits, control, target);
        depth += 1;
      }
      continue;
    }

    if (type === 'CZ') {
      const control = Number.isInteger(gate.control) ? gate.control : 0;
      const target = Number.isInteger(gate.target) ? gate.target : 1;
      if (control !== target && control >= 0 && target >= 0 && control < qubits && target < qubits) {
        applyControlledZGate(state, qubits, control, target);
        depth += 1;
      }
      continue;
    }

    const target = Number.isInteger(gate.target) ? gate.target : 0;
    if (target < 0 || target >= qubits) {
      continue;
    }

    const matrix = gateMatrix(type, gate.params || {});
    applySingleQubitGate(state, qubits, target, matrix);
    depth += 1;
  }

  return {
    qubits,
    depth,
    state: normalizeState(state),
  };
}

function prepareQubitStates(payload = {}) {
  const qubits = Math.max(1, Math.min(10, Number(payload.qubits) || 1));
  const state = decodeInitialState(payload, qubits);
  return {
    qubits,
    stateVector: state,
    probabilities: toProbabilityDistribution(state),
    circuitDepth: 0,
  };
}

function applyGateCircuits(payload = {}) {
  const simulation = simulateCircuit(payload);
  return {
    qubits: simulation.qubits,
    circuitDepth: simulation.depth,
    stateVector: simulation.state,
    probabilities: toProbabilityDistribution(simulation.state),
  };
}

function exploitInterference(payload = {}) {
  const qubits = Math.max(1, Math.min(10, Number(payload.qubits) || 2));
  const defaultCircuit = [
    { type: 'H', target: 0 },
    { type: 'H', target: Math.min(1, qubits - 1) },
    { type: 'CNOT', control: 0, target: Math.min(1, qubits - 1) },
    { type: 'RZ', target: 0, params: { theta: Math.PI / 3 } },
    { type: 'H', target: 0 },
  ];

  const simulation = simulateCircuit({
    qubits,
    statePreset: payload.statePreset || 'zero',
    circuit: Array.isArray(payload.circuit) && payload.circuit.length > 0 ? payload.circuit : defaultCircuit,
  });

  const probabilities = toProbabilityDistribution(simulation.state);
  const topIndex = probabilities.reduce((best, value, index, arr) => (value > arr[best] ? index : best), 0);

  return {
    qubits,
    circuitDepth: simulation.depth,
    interferencePeak: {
      basisState: toBitString(topIndex, qubits),
      probability: probabilities[topIndex],
    },
    probabilities,
    stateVector: simulation.state,
  };
}

function measureOutputs(payload = {}) {
  const shots = Math.max(1, Number(payload.shots) || 1024);
  const prng = createPrng(payload.seed || `measure-${shots}`);

  const simulation = payload.stateVector
    ? {
      qubits: Math.max(1, Math.round(Math.log2(payload.stateVector.length || 2))),
      depth: Number(payload.circuitDepth) || 0,
      state: normalizeState((payload.stateVector || []).map(toComplex)),
    }
    : simulateCircuit(payload);

  const probabilities = toProbabilityDistribution(simulation.state);
  const counts = sampleFromProbabilities(probabilities, shots, simulation.qubits, prng);

  return {
    qubits: simulation.qubits,
    circuitDepth: simulation.depth,
    shots,
    counts,
    probabilities,
  };
}

function runSurfaceCodeCorrection(payload = {}) {
  const rounds = Math.max(1, Number(payload.rounds) || 8);
  const physicalQubits = Math.max(9, Number(payload.physicalQubits) || 17);
  const baseErrorRate = Number.isFinite(payload.errorRate) ? payload.errorRate : 0.02;

  const logicalErrorRate = Math.max(0.0001, baseErrorRate / Math.max(2, rounds));

  return {
    rounds,
    physicalQubits,
    syndromeEvents: Math.round(rounds * physicalQubits * baseErrorRate),
    correctedSyndromes: Math.round(rounds * physicalQubits * baseErrorRate * 0.88),
    logicalErrorRate,
    circuitDepth: rounds * 6,
    shots: Math.max(512, Number(payload.shots) || 2048),
  };
}

function runLogicalQubits(payload = {}) {
  const logicalQubits = Math.max(1, Number(payload.logicalQubits) || 2);
  const codeDistance = Math.max(3, Number(payload.codeDistance) || 5);
  const cycles = Math.max(1, Number(payload.cycles) || 12);

  return {
    logicalQubits,
    codeDistance,
    cycles,
    estimatedFaultTolerance: Number((1 - (1 / (codeDistance * cycles * 10))).toFixed(6)),
    circuitDepth: cycles * codeDistance,
    shots: Math.max(1024, Number(payload.shots) || 4096),
  };
}

function runVqe(payload = {}) {
  const iterations = Math.max(5, Number(payload.iterations) || 30);
  const initialEnergy = Number.isFinite(payload.initialEnergy) ? payload.initialEnergy : -0.8;
  const targetEnergy = Number.isFinite(payload.targetEnergy) ? payload.targetEnergy : -1.15;
  let current = initialEnergy;

  for (let i = 0; i < iterations; i += 1) {
    current -= (current - targetEnergy) * 0.18;
  }

  return {
    iterations,
    convergedEnergy: Number(current.toFixed(8)),
    targetEnergy,
    circuitDepth: iterations * 4,
    shots: Math.max(1024, Number(payload.shots) || 4096),
  };
}

function runQaoa(payload = {}) {
  const depthP = Math.max(1, Number(payload.depthP) || 3);
  const nodes = Math.max(4, Number(payload.nodes) || 12);
  const samples = Math.max(16, Number(payload.samples) || 64);

  let bestBitString = '';
  let bestScore = Number.NEGATIVE_INFINITY;
  const prng = createPrng(payload.seed || `qaoa-${nodes}-${depthP}`);

  for (let i = 0; i < samples; i += 1) {
    let bitString = '';
    for (let b = 0; b < nodes; b += 1) {
      bitString += prng() >= 0.5 ? '1' : '0';
    }
    const score = bitString.split('').reduce((acc, bit, idx) => acc + (bit === '1' ? 1 : -0.2 * ((idx % 3) + 1)), 0);
    if (score > bestScore) {
      bestScore = score;
      bestBitString = bitString;
    }
  }

  return {
    nodes,
    depthP,
    bestBitString,
    bestScore: Number(bestScore.toFixed(4)),
    circuitDepth: depthP * 10,
    shots: Math.max(1024, Number(payload.shots) || 4096),
  };
}

function factorInteger(n) {
  const value = Math.max(2, Math.floor(Number(n) || 15));
  const factors = [];
  let remainder = value;

  for (let divisor = 2; divisor * divisor <= remainder; divisor += 1) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }

  if (remainder > 1) {
    factors.push(remainder);
  }

  return factors;
}

function runShor(payload = {}) {
  const composite = Math.max(4, Math.floor(Number(payload.composite) || 21));
  const factors = factorInteger(composite);

  return {
    composite,
    factors,
    circuitDepth: Math.max(24, factors.length * 20),
    shots: Math.max(2048, Number(payload.shots) || 4096),
  };
}

function runGrover(payload = {}) {
  const qubits = Math.max(2, Number(payload.qubits) || 4);
  const spaceSize = 1 << qubits;
  const target = Number.isInteger(payload.targetIndex)
    ? Math.max(0, Math.min(spaceSize - 1, payload.targetIndex))
    : Math.min(spaceSize - 1, 3);
  const iterations = Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(spaceSize)));

  return {
    qubits,
    spaceSize,
    iterations,
    targetIndex: target,
    targetBitString: toBitString(target, qubits),
    successProbability: Number((1 - (1 / Math.sqrt(spaceSize))).toFixed(6)),
    circuitDepth: iterations * 3,
    shots: Math.max(1024, Number(payload.shots) || 4096),
  };
}

function runAmplitudeEstimation(payload = {}) {
  const samples = Math.max(8, Number(payload.samples) || 64);
  const trueAmplitude = Number.isFinite(payload.trueAmplitude)
    ? Math.min(0.999, Math.max(0.001, payload.trueAmplitude))
    : 0.63;

  const estimate = trueAmplitude + ((1 / Math.sqrt(samples)) * 0.12);
  return {
    samples,
    estimatedAmplitude: Number(Math.min(1, estimate).toFixed(6)),
    confidence: Number((1 - (1 / Math.sqrt(samples))).toFixed(6)),
    circuitDepth: Math.max(16, samples / 2),
    shots: Math.max(1024, Number(payload.shots) || 2048),
  };
}

function runPhaseEstimation(payload = {}) {
  const phase = Number.isFinite(payload.phase) ? payload.phase : (Math.PI / 3);
  const precisionBits = Math.max(2, Number(payload.precisionBits) || 8);
  const normalized = ((phase % TWO_PI) + TWO_PI) % TWO_PI;
  const estimate = Math.round((normalized / TWO_PI) * (2 ** precisionBits)) / (2 ** precisionBits);

  return {
    phase,
    precisionBits,
    estimatedPhaseFraction: Number(estimate.toFixed(8)),
    circuitDepth: precisionBits * 6,
    shots: Math.max(1024, Number(payload.shots) || 4096),
  };
}

function runChemistrySimulation(payload = {}) {
  const molecule = String(payload.molecule || 'H2');
  const basisSet = String(payload.basisSet || 'sto-3g');
  const iterations = Math.max(5, Number(payload.iterations) || 40);

  let energy = Number.isFinite(payload.initialEnergy) ? payload.initialEnergy : -0.7;
  const target = Number.isFinite(payload.targetEnergy) ? payload.targetEnergy : -1.137;
  for (let i = 0; i < iterations; i += 1) {
    energy -= (energy - target) * 0.15;
  }

  return {
    molecule,
    basisSet,
    iterations,
    estimatedGroundStateEnergy: Number(energy.toFixed(8)),
    circuitDepth: iterations * 5,
    shots: Math.max(2048, Number(payload.shots) || 4096),
  };
}

function runAnnealingOptimization(payload = {}) {
  const variables = Math.max(4, Number(payload.variables) || 20);
  const sweeps = Math.max(10, Number(payload.sweeps) || 200);

  const bestEnergy = Number((-0.3 * variables).toFixed(4));
  return {
    variables,
    sweeps,
    bestEnergy,
    circuitDepth: Math.max(4, Math.round(sweeps / 20)),
    shots: Math.max(256, Number(payload.shots) || 1024),
  };
}

function runHybridWorkflow(payload = {}) {
  const preparation = prepareQubitStates(payload);
  const circuitResult = applyGateCircuits({
    ...payload,
    qubits: preparation.qubits,
    initialState: preparation.stateVector,
    circuit: Array.isArray(payload.circuit) && payload.circuit.length > 0
      ? payload.circuit
      : [
        { type: 'H', target: 0 },
        { type: 'CNOT', control: 0, target: Math.min(1, preparation.qubits - 1) },
      ],
  });
  const measurement = measureOutputs({
    stateVector: circuitResult.stateVector,
    circuitDepth: circuitResult.circuitDepth,
    shots: Number(payload.shots) || 1024,
    seed: payload.seed,
  });

  return {
    preparation,
    circuitResult,
    measurement,
    circuitDepth: (circuitResult.circuitDepth || 0),
    shots: measurement.shots,
  };
}

function executeClassicalOperation(operation, payload = {}) {
  const start = Date.now();
  let result;

  switch (operation) {
    case 'prepare-qubit-state':
      result = prepareQubitStates(payload);
      break;
    case 'apply-gate-circuit':
      result = applyGateCircuits(payload);
      break;
    case 'exploit-interference':
      result = exploitInterference(payload);
      break;
    case 'measure-output':
      result = measureOutputs(payload);
      break;
    case 'surface-code-error-correction':
      result = runSurfaceCodeCorrection(payload);
      break;
    case 'logical-qubit-fault-tolerant-execution':
      result = runLogicalQubits(payload);
      break;
    case 'vqe-optimization':
      result = runVqe(payload);
      break;
    case 'qaoa-optimization':
      result = runQaoa(payload);
      break;
    case 'shor-factorization':
      result = runShor(payload);
      break;
    case 'grover-search':
      result = runGrover(payload);
      break;
    case 'amplitude-estimation':
      result = runAmplitudeEstimation(payload);
      break;
    case 'phase-estimation':
      result = runPhaseEstimation(payload);
      break;
    case 'chemistry-materials-simulation':
      result = runChemistrySimulation(payload);
      break;
    case 'annealing-optimization':
      result = runAnnealingOptimization(payload);
      break;
    case 'hybrid-quantum-workflow':
      result = runHybridWorkflow(payload);
      break;
    default:
      result = {
        operation,
        message: 'Classical orchestration fallback executed',
        circuitDepth: Number(payload.circuitDepth) || 1,
        shots: Number(payload.shots) || 1,
      };
      break;
  }

  const latencyMs = Date.now() - start;
  const circuitDepth = Number(result.circuitDepth) || Number(payload.circuitDepth) || 1;
  const shots = Number(result.shots) || Number(payload.shots) || 1024;

  return {
    result,
    metrics: {
      circuitDepth,
      shots,
      fidelity: 0.999,
      errorRate: 0.001,
      errorRates: {
        readout: 0.0005,
        gate: 0.0005,
      },
      costUsd: 0,
      latencyMs,
      executionPath: 'classical-fallback',
    },
  };
}

module.exports = {
  executeClassicalOperation,
};
