# Quantum Provider Keys Setup

This runtime supports provider credentials from `.env.quantum.local`, `.env.quantum`, `.env.local`, and `.env` (in that order).

## 1) Prepare local env file

1. Copy `.env.quantum.example` to `.env.quantum.local`.
2. Fill only the providers you plan to use.
3. Keep `.env.quantum.local` private (it is ignored by git).

## 1.5) No-account local provider (Qiskit Aer)

You can run quantum-provider execution locally with no cloud account and no API keys.

1. Ensure these values in `.env.quantum.local`:
   - `QUANTUM_LOCAL_QISKIT_ENABLED=true`
   - `QUANTUM_LOCAL_QISKIT_ONLY=true`
   - `QUANTUM_PROVIDER_SIMULATION=true` (optional; cloud providers stay simulated)
2. Install local simulator packages:

```bash
python -m pip install qiskit qiskit-aer
```

Windows alternative:

```bash
py -m pip install qiskit qiskit-aer
```

Optional custom Python path:
- `QUANTUM_LOCAL_QISKIT_PYTHON=C:/path/to/python.exe`

If you also want cloud providers to remain eligible after local attempts, set:
- `QUANTUM_LOCAL_QISKIT_ONLY=false`

## 2) Provider key acquisition

### IBM Quantum

1. Create/sign in at https://quantum.ibm.com/.
2. Open Account settings and generate/copy your API token.
3. Set:
   - `IBM_QUANTUM_ENDPOINT`
   - `IBM_QUANTUM_API_KEY`

Accepted aliases:
- `QISKIT_RUNTIME_ENDPOINT` (endpoint)
- `QISKIT_IBM_TOKEN` or `IBM_QUANTUM_TOKEN` (token)

### AWS Braket

1. Create/sign in at https://aws.amazon.com/braket/.
2. Create IAM credentials in AWS Console (Access Key ID + Secret Access Key).
3. If you use an internal adapter endpoint for this runtime, set:
   - `AWS_BRAKET_ENDPOINT`
   - `AWS_BRAKET_API_KEY`

Note: this runtime currently dispatches via HTTP endpoint + token. Direct SigV4 signing flow is not implemented here.

Accepted aliases:
- `AMAZON_BRAKET_ENDPOINT` (endpoint)
- `AWS_BRAKET_TOKEN` (token)

### Azure Quantum

1. Create/sign in at https://portal.azure.com/.
2. Create an Azure Quantum workspace.
3. In workspace keys/settings, copy endpoint and key.
4. Set:
   - `AZURE_QUANTUM_ENDPOINT`
   - `AZURE_QUANTUM_API_KEY`

Accepted alias:
- `AZURE_QUANTUM_KEY`

### D-Wave Leap

1. Create/sign in at https://cloud.dwavesys.com/leap/.
2. Generate/copy your API token from account settings.
3. Set:
   - `DWAVE_ENDPOINT`
   - `DWAVE_API_TOKEN`

Accepted aliases:
- `DWAVE_API_KEY`
- `DWAVE_TOKEN`

## 3) Validate readiness

Run:

```bash
npm run quantum:provider-readiness
```

Strict mode (exit code 1 if any provider is missing config):

```bash
npm run quantum:provider-readiness:strict
```

JSON output:

```bash
npm run quantum:provider-readiness:json
```

Local provider smoke test (expects `local-qiskit-aer` when Qiskit is installed):

```bash
npm run quantum:local-qiskit-smoke
```

## 4) Simulation fallback toggle

If you want testable behavior without live keys:

```bash
QUANTUM_PROVIDER_SIMULATION=true
```

With simulation enabled, provider calls return deterministic simulated provider telemetry rather than live endpoint traffic.
