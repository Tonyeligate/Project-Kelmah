# Kelmah Design Handoff Documentation

## Project Overview
Kelmah is a high-fidelity marketplace connecting verified artisans with hirers, optimized for native mobile experiences in Ghana (Android and iOS). The platform features a robust escrow system, real-time messaging, and comprehensive project tracking.

## Technical Stack Recommendation
- **Frontend**: React Native / Flutter (for cross-platform consistency)
- **Styling**: Tailwind CSS (Native) or Styled Components
- **State Management**: Redux Toolkit (Context providers already architected for Message, Notification, and Payments)
- **Real-time**: Socket.io
- **Payments**: Paystack / Flutterwave integration (Mobile Money focus)

## Design System: Kelmah Artisan
- **Typography**: Montserrat (Headlines & UI Labels)
- **Primary Palette**: 
  - Brand Yellow: `#FFD700` (High contrast actions)
  - Surface Dark: `#1A1A1A` (Professional grounding)
  - Success Green: `#4CAF50` (Verified status/Completed)
- **Shape System**: 8px corner radius (Rounded Eight)

## Screen Map Summary (50+ Screens)

### 1. Onboarding & Identity
- {{DATA:SCREEN:SCREEN_94}}: Splash Screen
- {{DATA:SCREEN:SCREEN_71}}: Welcome Onboarding
- {{DATA:SCREEN:SCREEN_46}}: Role Selection
- {{DATA:SCREEN:SCREEN_92}}, {{DATA:SCREEN:SCREEN_10}}, {{DATA:SCREEN:SCREEN_97}}: Walkthrough Carousel
- {{DATA:SCREEN:SCREEN_99}}, {{DATA:SCREEN:SCREEN_74}}: ID Verification & Liveness

### 2. Marketplace & Discovery
- {{DATA:SCREEN:SCREEN_43}}: Home / Landing
- {{DATA:SCREEN:SCREEN_112}}: Browse Trades
- {{DATA:SCREEN:SCREEN_44}}: Search Workers
- {{DATA:SCREEN:SCREEN_110}}: Discover Artisans (Project-based)
- {{DATA:SCREEN:SCREEN_36}}: Worker Profile

### 3. Messaging & Social
- {{DATA:SCREEN:SCREEN_117}}: Messages List
- {{DATA:SCREEN:SCREEN_38}}: Active Chat
- {{DATA:SCREEN:SCREEN_33}}: Shared Media Gallery
- {{DATA:SCREEN:SCREEN_28}}: Referral Hub

### 4. Project Management
- {{DATA:SCREEN:SCREEN_49}}: Post a Job
- {{DATA:SCREEN:SCREEN_35}}: Submit Proposal
- {{DATA:SCREEN:SCREEN_80}}: Contract Agreement
- {{DATA:SCREEN:SCREEN_84}}: Contract Revisions
- {{DATA:SCREEN:SCREEN_65}}: Job Progress Tracker
- {{DATA:SCREEN:SCREEN_104}}: Milestone Approval
- {{DATA:SCREEN:SCREEN_100}}: Project Audit Log

### 5. Financials & Wallet
- {{DATA:SCREEN:SCREEN_32}}: Wallet & Payments
- {{DATA:SCREEN:SCREEN_113}}: Transaction History
- {{DATA:SCREEN:SCREEN_73}}: Earnings Analytics
- {{DATA:SCREEN:SCREEN_66}}: Project Finances
- {{DATA:SCREEN:SCREEN_114}}: Payout Methods
- {{DATA:SCREEN:SCREEN_98}}: Invoice Detail

### 6. Account & Support
- {{DATA:SCREEN:SCREEN_40}}: Profile Settings
- {{DATA:SCREEN:SCREEN_72}}: Security Center
- {{DATA:SCREEN:SCREEN_103}}: Notification Preferences
- {{DATA:SCREEN:SCREEN_68}}: Help Center Hub
- {{DATA:SCREEN:SCREEN_22}}: Support Ticket Submission

### 7. Administrative
- {{DATA:SCREEN:SCREEN_53}}: Dispute Moderation Queue
- {{DATA:SCREEN:SCREEN_54}}: Verification Queue
- {{DATA:SCREEN:SCREEN_7}}: Admin Dispute Detail

## Design Logic
The system uses a **Escrow-First** philosophy. Funds are captured at milestone definition and released only upon client approval (via {{DATA:SCREEN:SCREEN_104}}), ensuring artisan payment security and hirer quality assurance.
