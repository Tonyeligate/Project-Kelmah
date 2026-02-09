# Messaging Page SEO Data Flow Analysis (Nov 12, 2025)

## UI Component Chain
- **Component File**: `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- **Context Provider**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- **Service File**: `kelmah-frontend/src/modules/messaging/services/messagingService.js`

## Flow Map
```
User navigates to /messages
  ↓
App.jsx lazy-loads MessagingPage component
  ↓
MessagingPage.jsx renders <SEO title="Messages" /> and mounts Helmet tags
  ↓
HelmetProvider in src/main.jsx writes <title>Messages | Kelmah</title> to the DOM
  ↓
MessageContext fires messagingService.getConversations()
  ↓
API call: GET /api/messaging/conversations via API Gateway
  ↓
Response: { success: true, data: [conversation...] }
  ↓
Context updates selectedConversation + conversations arrays
  ↓
MessagingPage re-renders ConversationList + Chatbox panes with live data
```

## Issues Found
❌ **Issue 1**: Messaging page lacked Helmet integration so browser titles persisted from previous route.
- **Location**: `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx` (return block)
- **Resolution**: Added `<SEO title="Messages" ... />` wrapper, restoring unique document titles.

❌ **Issue 2**: Shared `SEO` component rendered visible placeholder text ("SEO") damaging page layout.
- **Location**: `kelmah-frontend/src/modules/common/components/common/SEO.jsx`
- **Resolution**: Replaced placeholder Box/Typography with a Helmet-based metadata helper (title, description, OpenGraph, Twitter).

## Recommendations
1. Extend new `SEO` helper usage across modules still importing `Helmet` directly for consistency and future analytics hooks.
2. Schedule a quick audit of top-level pages (dashboard, profile, settings) to ensure each sets a specific title/description now that the helper behaves correctly.
