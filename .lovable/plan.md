

## Redesign Pricing: 2 Tiers (Pro + Enterprise), No Prices, "Book a Demo" CTA

### Overview
Replace the current 3-tier pricing with a 2-tier layout (Pro + Enterprise) matching the reference image structure. Remove all dollar prices and billing toggles. Replace CTA buttons with "Book a Demo" links pointing to `/contact`. Update all references across the app.

### Design

**Pro** (marked "Most Popular"):
- Description: "Unlock advanced AI tools and expanded search capabilities to win more contracts."
- CTA: "Book a Demo" button (gradient/primary style)
- Features:
  - Everything in Starter
  - AI-Powered State, Local and Education Search
  - AI-Powered DIBBS and Forecasts (New)
  - AI-Powered Prime and Subcontractor Search (New)
  - AI-Powered Partnership Search (New)
  - Federal Award Search (New)
  - Market Watch (New)
  - Small Business Specialists Directory (New)
  - AI-Powered Grants Search
  - AI-Powered SBIR/STTR Search
  - AI-Powered Proposal Generator
  - AI-Powered Proposal Editor
  - Project Management Journey
  - Deep-AI Opportunity Match Analysis

**Enterprise**:
- Description: "Full platform access with dedicated onboarding, custom templates, and scalable team seats."
- CTA: "Book a Demo" button
- Features:
  - Everything in Professional
  - Dedicated Support (priority chat + video)
  - Custom Proposal Templates
  - Team 1:1 Onboarding
  - Custom Training for Your Team

### Files to Change

**1. `src/components/landing/PricingSection.tsx`** (major rewrite)
- Replace the plans array with 2 plans using the descriptions above
- Remove monthly/yearly price fields and billing toggle
- Change all CTAs to "Book a Demo" linking to `/contact`
- Add "New" badges on specific Pro features
- Update grid from `md:grid-cols-3` to `md:grid-cols-2` with `max-w-4xl` centering
- Keep FAQ section as-is

**2. `src/pages/Pricing.tsx`** (minor)
- Update subtitle to remove price-related wording

**3. `src/pages/Settings.tsx`**
- Update "Change Plan" / "View Plans" buttons to say "Book a Demo" linking to `/contact`

**4. `src/components/subscription/FeatureGate.tsx`**
- Change "Upgrade Plan" to "Book a Demo", link to `/contact`

**5. `src/components/subscription/UsageLimitBanner.tsx`**
- Change "Upgrade" to "Book a Demo", link to `/contact`

### Technical Details

**PricingSection.tsx -- new plans array:**

```typescript
const plans = [
  {
    name: "Pro",
    description: "Unlock advanced AI tools and expanded search capabilities to win more contracts.",
    badge: "Most Popular",
    popular: true,
    features: [
      { text: "Everything in Starter", isNew: false },
      { text: "AI-Powered State, Local and Education Search", isNew: false },
      { text: "AI-Powered DIBBS & Forecasts", isNew: true },
      { text: "AI-Powered Prime & Subcontractor Search", isNew: true },
      { text: "AI-Powered Partnership Search", isNew: true },
      { text: "Federal Award Search", isNew: true },
      { text: "Market Watch", isNew: true },
      { text: "Small Business Specialists Directory", isNew: true },
      { text: "AI-Powered Grants Search", isNew: false },
      { text: "AI-Powered SBIR/STTR Search", isNew: false },
      { text: "AI-Powered Proposal Generator", isNew: false },
      { text: "AI-Powered Proposal Editor", isNew: false },
      { text: "Project Management Journey", isNew: false },
      { text: "Deep-AI Opportunity Match Analysis", isNew: false },
    ],
  },
  {
    name: "Enterprise",
    description: "Full platform access with dedicated onboarding, custom templates, and scalable team seats.",
    badge: null,
    popular: false,
    features: [
      { text: "Everything in Professional", isNew: false },
      { text: "Dedicated Support (priority chat + video)", isNew: false },
      { text: "Custom Proposal Templates", isNew: false },
      { text: "Team 1:1 Onboarding", isNew: false },
      { text: "Custom Training for Your Team", isNew: false },
    ],
  },
];
```

- All "Book a Demo" buttons link to `/contact`
- "New" badges rendered as small accent-colored Badge components inline
- Monthly/yearly toggle removed entirely
- Grid centered with `max-w-4xl mx-auto`

