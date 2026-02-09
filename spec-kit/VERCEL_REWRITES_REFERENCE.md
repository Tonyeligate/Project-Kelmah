# Kelmah Frontend Vercel Rewrites Reference

## Purpose
This document records the current Vercel rewrite rules for API and WebSocket traffic, ensuring clarity and avoiding future confusion about frontend-backend connection protocols.

---

## Current Rewrite Rules (as of 2025-09-28)

### File: kelmah-frontend/vercel.json

```
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://kelmah-api-gateway-si57.onrender.com/api/$1,http://154.161.138.112:5000/api/$1"
    },
    {
      "source": "/socket.io/(.*)",
      "destination": "https://kelmah-api-gateway-si57.onrender.com/socket.io/$1,http://154.161.138.112:5000/socket.io/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Key Points
- **Primary Gateway:** `https://kelmah-api-gateway-si57.onrender.com` (Render HTTPS)
- **Fallback Gateway:** `http://154.161.138.112:5000` (Local IP HTTP)
- **Unified WebSocket Routing:** Both `/api/*` and `/socket.io/*` traffic are routed to both gateways.
- **Purpose:** Ensures frontend can connect to backend via Render in production, with automatic fallback to local IP if Render is unavailable.

---

## Usage
- **Do not manually edit these rewrites unless protocol changes.**
- **Reference this document for all future frontend-backend connection troubleshooting.**
- **Update this record if gateway URLs or protocol change.**

---

_Last updated: 2025-09-28_
