#!/usr/bin/env python3

import json
import math
import random
import sys
import time


def _read_request():
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    return json.loads(raw)


def _to_int(value, default, minimum=1, maximum=16):
    try:
        parsed = int(value)
    except Exception:
        return default

    if parsed < minimum:
        return minimum
    if parsed > maximum:
        return maximum
    return parsed


def _to_float(value, default):
    try:
        return float(value)
    except Exception:
        return default


def _apply_gate(circuit, qubits, gate):
    if not isinstance(gate, dict):
        return

    gate_type = str(gate.get('type', '')).upper().strip()
    params = gate.get('params') if isinstance(gate.get('params'), dict) else {}

    target = _to_int(gate.get('target', 0), 0, minimum=0, maximum=max(0, qubits - 1))

    if gate_type == 'H':
        circuit.h(target)
    elif gate_type == 'X':
        circuit.x(target)
    elif gate_type == 'Y':
        circuit.y(target)
    elif gate_type == 'Z':
        circuit.z(target)
    elif gate_type == 'S':
        circuit.s(target)
    elif gate_type == 'T':
        circuit.t(target)
    elif gate_type == 'RX':
        circuit.rx(_to_float(params.get('theta'), math.pi / 2), target)
    elif gate_type == 'RY':
        circuit.ry(_to_float(params.get('theta'), math.pi / 2), target)
    elif gate_type == 'RZ':
        circuit.rz(_to_float(params.get('theta'), math.pi / 2), target)
    elif gate_type in ('CNOT', 'CX'):
        control = _to_int(gate.get('control', 0), 0, minimum=0, maximum=max(0, qubits - 1))
        if control != target:
            circuit.cx(control, target)
    elif gate_type == 'CZ':
        control = _to_int(gate.get('control', 0), 0, minimum=0, maximum=max(0, qubits - 1))
        if control != target:
            circuit.cz(control, target)


def _apply_default_pattern(circuit, operation, qubits):
    if operation == 'prepare-qubit-state':
        circuit.h(0)
        return

    if operation == 'measure-output':
        circuit.h(0)
        return

    for index in range(qubits):
        circuit.h(index)

    if qubits >= 2:
        circuit.cx(0, 1)


def _build_response(operation, payload):
    try:
        from qiskit import QuantumCircuit, transpile
        from qiskit_aer import AerSimulator
    except Exception as error:
        raise RuntimeError(
            'Qiskit Aer is not available. Install with: python -m pip install qiskit qiskit-aer'
        ) from error

    qubits = _to_int(payload.get('qubits', 2), 2, minimum=1, maximum=12)
    shots = _to_int(payload.get('shots', 1024), 1024, minimum=1, maximum=32768)
    operation_name = str(operation or 'unknown')

    circuit = QuantumCircuit(qubits, qubits)

    if operation_name == 'apply-gate-circuit' and isinstance(payload.get('circuit'), list) and payload.get('circuit'):
        for gate in payload.get('circuit'):
            _apply_gate(circuit, qubits, gate)
    else:
        _apply_default_pattern(circuit, operation_name, qubits)

    circuit.measure(range(qubits), range(qubits))

    backend = AerSimulator()

    started_at = time.time()
    transpiled = transpile(circuit, backend)
    result = backend.run(transpiled, shots=shots).result()
    elapsed_ms = max(1, int((time.time() - started_at) * 1000))

    counts = result.get_counts()
    depth = transpiled.depth() or circuit.depth() or 1

    fidelity = max(0.85, 1 - min(0.12, depth * 0.0012))
    fidelity = round(fidelity, 6)
    error_rate = round(1 - fidelity, 6)

    return {
        'provider': 'local-qiskit-aer',
        'providerJobId': f"lqa-{int(time.time() * 1000)}-{random.randint(1000, 9999)}",
        'metrics': {
            'shots': shots,
            'circuitDepth': max(1, int(depth)),
            'fidelity': fidelity,
            'errorRate': error_rate,
            'readoutErrorRate': round(error_rate * 0.45, 6),
            'gateErrorRate': round(error_rate * 0.55, 6),
            'costUsd': 0,
            'latencyMs': elapsed_ms,
        },
        'result': {
            'mode': 'local-qiskit-aer',
            'backend': 'aer_simulator',
            'operation': operation_name,
            'qubits': qubits,
            'shots': shots,
            'counts': counts,
            'circuitDepth': max(1, int(depth)),
        },
    }


def main():
    try:
        request = _read_request()
        operation = request.get('operation')
        payload = request.get('payload') if isinstance(request.get('payload'), dict) else {}
        response = _build_response(operation, payload)
        print(json.dumps(response))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
