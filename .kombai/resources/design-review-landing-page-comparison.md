# Design Review: Kelmah Landing Page vs Upwork & Freelancer

**Review Date**: February 9, 2026  
**Route**: `/` (Landing Page)  
**Focus Areas**: Visual Design, UX/Usability, Trust Elements, Mobile Responsiveness  
**Benchmark Sites**: Upwork.com, Freelancer.com

---

## Executive Summary

After analyzing Upwork and Freelancer's landing pages against Kelmah's current implementation, I've identified **12 critical UI/UX gaps** that explain why your landing page doesn't match the polish and professionalism of these industry leaders. The core issues revolve around: **weak hero visual impact**, **missing trust signals**, **inconsistent brand expression**, and **suboptimal visual hierarchy**.

---

## What Upwork & Freelancer Are Doing Right

### 1. Hero Section Excellence

| Aspect | Upwork | Freelancer | Kelmah (Current) |
|--------|--------|------------|------------------|
| **Background** | High-quality hero photo of real professional | Cinematic dark with phone mockups & video | Generic purple gradient |
| **Headline** | "Connecting businesses in need to freelancers who deliver" | "Hire the best freelancers for any job, online." | "Find Work. Get Hired. Earn Money." |
| **CTAs** | Dual pills: "Find talent" / "Browse jobs" + Search bar | High-contrast pink "Hire a Freelancer" + outlined secondary | Yellow + outlined white buttons |
| **Trust Logos** | Microsoft, Airbnb, Bissell, Glassdoor | Adobe, Facebook, Deloitte, NASA, IBM, Airbus, Google | ❌ None |
| **Value Props** | Category icons + "millions of pros" | Bullet list with concrete benefits | Job type avatars (too small) |

### 2. Visual Hierarchy Mastery

- **Large typography**: Headlines are 48-72px, creating instant impact
- **Clear sections**: Each section has distinct purpose and breathing room
- **Progressive disclosure**: Hero → Categories → How it Works → Testimonials → CTA
- **Consistent spacing**: 80-120px between major sections

### 3. Trust & Social Proof

- **Company logos** in hero area (immediate credibility)
- **Real testimonials** with photos, names, and star ratings
- **Concrete metrics**: "86.6 million professionals", "80% of jobs receive bids within 60 seconds"
- **Press mentions**: "As seen on" with NYT, CNBC, Wall Street Journal logos

### 4. Mobile Optimization

- **Upwork**: Clean header with Sign up CTA, scrollable category chips
- **Freelancer**: Full-bleed hero, stacked CTAs, swipeable sections

---

## Issues in Kelmah's Current Implementation

### 🔴 Critical Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Generic gradient background** - Purple/violet gradient (`#667eea → #764ba2`) doesn't align with gold/black brand and lacks visual interest | `SimplifiedHero.jsx:44` | Major - Looks template-like, not premium |
| 2 | **No trust logos** - Missing company/client logos that competitors prominently display | `SimplifiedHero.jsx` | Major - Reduces credibility instantly |
| 3 | **"How it Works" card in hero** - Takes valuable hero real estate, should be separate section | `SimplifiedHero.jsx:207-299` | Major - Clutters hero, reduces impact |
| 4 | **No hero imagery** - No photos/illustrations of workers or platform in action | `SimplifiedHero.jsx` | Major - Competitors use compelling visuals |

### 🟠 High Priority Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 5 | **Small job type icons** (56x56px avatars) - Don't create visual impact like Upwork's large category cards | `SimplifiedHero.jsx:97-107` | High - Fails to communicate platform scope |
| 6 | **Stats cards cramped** - "5000+ Active Jobs" and "10K+ Workers" look like afterthoughts | `SimplifiedHero.jsx:302-339` | High - Metrics should be prominent proof points |
| 7 | **Missing search bar** - Upwork has prominent search in hero; helps users immediately find what they need | N/A | High - Reduces user engagement |
| 8 | **Weak CTA contrast** - "I WANT WORK" and "I NEED WORKER" text is awkward; should be clearer | `SimplifiedHero.jsx:116-158` | High - Confusing messaging |

### 🟡 Medium Priority Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 9 | **Footer accordion on mobile** feels cramped and basic | `Footer.jsx:190-271` | Medium - Doesn't feel premium |
| 10 | **Missing testimonials section** on landing page | N/A | Medium - No social proof from users |
| 11 | **No "As seen in" or press logos** | N/A | Medium - Missing authority signals |
| 12 | **No animated/interactive elements** in hero beyond basic framer-motion fade | `SimplifiedHero.jsx` | Medium - Static feel vs competitor dynamism |

---

## Recommended Improvements

### Phase 1: Hero Section Overhaul (High Impact)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                    Sign In  CTA │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │                     │  │                                  │  │
│  │  HEADLINE           │  │    ┌────────────────────────┐   │  │
│  │  "Find Skilled      │  │    │                        │   │  │
│  │   Workers in Ghana" │  │    │   HERO IMAGE           │   │  │
│  │                     │  │    │   (Worker photo or     │   │  │
│  │  Subheadline        │  │    │    Platform preview)   │   │  │
│  │                     │  │    │                        │   │  │
│  │  [Find Workers]     │  │    └────────────────────────┘   │  │
│  │  [I'm a Worker]     │  │                                  │  │
│  │                     │  │                                  │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TRUST BAR: Company logos or "Trusted by X+ businesses"  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Specific Changes:**
1. Replace gradient with hero image or dark overlay on image
2. Add trust logos below CTAs (even placeholder "Trusted by 500+ businesses")
3. Move "How it Works" to separate section below hero
4. Add search bar for job/worker discovery
5. Improve CTA copy: "Find Workers" / "Browse Jobs" (like Upwork)

### Phase 2: Add Social Proof Sections

```
┌──────────────────────────────────────────────────────────────────┐
│                      HOW IT WORKS                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  1. Post │    │ 2. Get   │    │ 3. Hire  │    │ 4. Pay   │   │
│  │  a Job   │ →  │ Proposals│ →  │  & Work  │ →  │  Safely  │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     STATS / METRICS                              │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│     │   5,000+    │  │   10,000+   │  │    98%      │           │
│     │  Active Jobs│  │   Workers   │  │ Satisfaction│           │
│     └─────────────┘  └─────────────┘  └─────────────┘           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     TESTIMONIALS                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ "Kelmah helped me find the perfect electrician..."         │ │
│  │  - Kwame A., Accra                              ⭐⭐⭐⭐⭐    │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 3: Brand Alignment

| Current | Recommended |
|---------|-------------|
| Purple gradient `#667eea` | Gold/Black brand: dark background with gold accents |
| Generic button styling | Gradient gold buttons with premium shadows |
| Basic animations | Subtle parallax, hover micro-interactions |
| No visual identity | Ghana flag colors subtly integrated |

---

## Design Token Recommendations

```javascript
// Recommended hero background options
const HERO_BACKGROUNDS = {
  option1: 'linear-gradient(135deg, #0E0F14 0%, #1F2028 50%, #0E0F14 100%)', // Dark obsidian
  option2: 'linear-gradient(180deg, #050507 0%, #161821 100%)', // Charcoal fade
  option3: 'url(/images/hero-worker.jpg) with overlay rgba(5, 5, 7, 0.7)', // Photo + overlay
};

// CTA improvements
const CTA_STYLES = {
  primary: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFE55C 100%)',
    color: '#000000',
    boxShadow: '0 18px 35px rgba(255, 215, 0, 0.35)',
  },
  secondary: {
    border: '2px solid rgba(255, 215, 0, 0.6)',
    color: '#FFD700',
    background: 'transparent',
  },
};
```

---

## Priority Action Items

1. **Immediate (1-2 hours)**:
   - Replace purple gradient with dark brand-aligned background
   - Move "How it Works" card to separate section
   - Improve CTA copy and sizing

2. **Short-term (1 day)**:
   - Add trust logo section (can use placeholder local businesses)
   - Add testimonials section with 3-4 quotes
   - Implement proper stats section with animations

3. **Medium-term (1 week)**:
   - Commission professional hero photography
   - Add search bar to hero
   - Implement category browsing section
   - Add micro-interactions and scroll animations

---

## Criticality Legend

- 🔴 **Critical**: Immediately impacts user perception and conversion
- 🟠 **High**: Significantly affects professional appearance
- 🟡 **Medium**: Noticeable polish issue
- ⚪ **Low**: Nice-to-have enhancement

---

## Next Steps

Would you like me to:
1. **Implement the hero section overhaul** with proper imagery and trust elements?
2. **Create a new testimonials component** for social proof?
3. **Redesign the footer** to match competitor quality?
4. **All of the above** - Full landing page redesign?

The most impactful change would be **Option 1 (Hero overhaul)** as it's the first thing users see.
