# Messaging Service Virus Scan Strategy – November 2025

## Overview
- Replaced the minimalist stub in `kelmah-backend/services/messaging-service/utils/virusScan.js` with a strategy-driven helper that supports:
  - **Stub** mode (default) for local development
  - **CLAMD/TCP** scanning when a ClamAV daemon is reachable
  - **HTTP vendor APIs** for hosted malware scanners
  - Optional **S3 streaming** so remote objects can be downloaded and scanned in-process when CLAMD is enabled
- Every scan now returns a normalized envelope `{ status, engine, details, metadata }` consumed by attachments routes, websocket handlers, and the polling worker.

## Configuration Surface
| Variable | Purpose | Default |
| --- | --- | --- |
| `VIRUS_SCAN_STRATEGY` | `clamav`, `http`, or `stub` | `stub` |
| `VIRUS_SCAN_TIMEOUT_MS` | Network timeout for scanner interactions | `8000` |
| `CLAMAV_HOST` / `CLAMAV_PORT` | Target daemon for CLAMD strategy | `127.0.0.1` / `3310` |
| `VIRUS_SCAN_HTTP_ENDPOINT` | POST endpoint for HTTP scanners | _required for http mode_ |
| `VIRUS_SCAN_HTTP_KEY` / `VIRUS_SCAN_HTTP_HEADER` | Optional API auth pair | unset |
| `VIRUS_SCAN_HTTP_EXTRA_HEADERS` | JSON or `Key=Value` list of additional headers | unset |
| `VIRUS_SCAN_HTTP_SEND_BASE64` | Sends base64 file data when true | `true` |
| `VIRUS_SCAN_HTTP_MAX_BASE64_BYTES` | Safety cap for embedded payloads | `5242880` |
| `ENABLE_S3_STREAM_SCAN` | When `true` and using CLAMD, downloads S3 objects for inline scanning | `false` |
| `S3_BUCKET`, `AWS_REGION` | Used when streaming objects from S3 | existing service values |

## Data Flow
1. **Attachments upload** populates `attachments[].virusScan` with `status: 'pending'`.
2. `utils/virusScanState` helper normalizes each attachment’s metadata (filename, mime, size, storage hints) and keeps a rolling status history so documents reflect the latest verdict.
3. `virusScan.scanBuffer(buffer, filename)` collects metadata: sha256, mime hints, bucket/key context.
4. Strategy branch:
   - **CLAMD**: stream chunks over `INSTREAM`, interpret `OK` vs `FOUND`, return `clean`/`infected`.
   - **HTTP**: send JSON payload to vendor endpoint with optional base64 data.
   - **Stub**: immediately returns `clean` (buffer) or `pending` (S3) with `simulated: true`.
5. `scanS3Object` can either:
   - Trigger HTTP vendor scan with `{ bucket, key }` payload, or
   - Download and rescan via `scanBuffer` when inline S3 scanning is enabled, or
   - Leave the object `pending` for an external worker to handle later.
6. `workers/virus-scan-worker.js` keeps polling attachments and reuses `scanS3Object`, merging responses back through `virusScanState.mergeScanResult` so history/metadata stay intact.

## Verification Steps
```bash
# 1. Default stub mode remains stable
node -e "const scan=require('./kelmah-backend/services/messaging-service/utils/virusScan');(async()=>{console.log(await scan.scanBuffer(Buffer.from('demo'),'demo.txt'));console.log(await scan.scanS3Object('attachments/test.pdf'));})();"

# 2. CLAMD mode (requires daemon)
set VIRUS_SCAN_STRATEGY=clamav
set CLAMAV_HOST=127.0.0.1
set CLAMAV_PORT=3310
node scripts/test-clam-scan.js   # optional helper to invoke scanBuffer

# 3. HTTP mode smoke test (sample webhook)
set VIRUS_SCAN_STRATEGY=http
set VIRUS_SCAN_HTTP_ENDPOINT=https://example.com/scan
set VIRUS_SCAN_HTTP_KEY=demo
set VIRUS_SCAN_HTTP_HEADER=x-api-key
node scripts/test-http-scan.js   # send mock payload, verify response handling
```

## Notes & Follow-Ups
- Worker currently fetches a maximum of 100 recent messages per tick; when CLAMD mode is active we should monitor memory when streaming large attachments.
- Future enhancement: swap metadata `mimeType` inference to leverage shared file-type utility once consolidated.
- Documented here so future agents can align environment toggles without spelunking the utility implementation.
