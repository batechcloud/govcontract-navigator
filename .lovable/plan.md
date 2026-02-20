
# Review: Buttons & Pages -- Issues Found

## Issues Identified

### 1. Missing `/demo` Route (Broken Link)
The Footer links to `/demo` (line 141 of `Footer.tsx`), but there is no `/demo` route in `App.tsx` and no `Demo` page exists. Clicking "Demo" in the footer leads to the 404 page.

**Fix:** Either create a simple Demo page or redirect `/demo` to `/contact` (since the Enterprise plan CTA already links to `/contact`).

### 2. Hero CTA Links Skip Auth
The landing page Hero section has "Find Contracts Now" linking to `/dashboard/search` and "See How It Works" linking to `/dashboard`. The CTA section links to `/dashboard/search`. The Pricing section "Start Free" buttons also link to `/dashboard/search`. These dashboard routes are not wrapped with `ProtectedRoute` in `App.tsx`, so unauthenticated users will land on the dashboard but see empty/broken data (no user session).

**Fix:** Either wrap dashboard routes with `ProtectedRoute` in `App.tsx`, or change the CTAs to link to `/auth?mode=signup` instead.

### 3. Dashboard Routes Not Protected
None of the dashboard routes (`/dashboard`, `/dashboard/search`, `/dashboard/tracked`, etc.) use `ProtectedRoute` even though the component exists in `src/components/auth/ProtectedRoute.tsx`. This means:
- Unauthenticated users can access all dashboard pages
- Pages will fail silently or show empty states instead of redirecting to login

**Fix:** Wrap all dashboard routes with `ProtectedRoute`.

### 4. `AuthProvider` Not Used in App
`useAuth` is imported across the app, but `AuthProvider` is never rendered in `App.tsx` or `main.tsx`. The `useAuth` hook has a fallback that returns `null` user when no provider is present, so auth effectively never works -- users appear logged out everywhere.

**Fix:** Wrap the app with `AuthProvider` in `App.tsx`.

### 5. ProposalGenerator Uses `<a href>` Instead of `<Link to>`
In `ProposalGenerator.tsx`, the `DataSourceItem` component uses `<a href={link}>` (line 284) instead of React Router's `<Link to={link}>`. This causes full page reloads when clicking "Business Profile", "Certifications", etc.

**Fix:** Change `<a href={link}>` to `<Link to={link}>`.

### 6. Bell Icon (Notifications) Does Nothing
The bell icon in `DashboardLayout.tsx` (line 85-88) is a button with no `onClick` handler. It shows a notification dot but clicking it does nothing.

**Fix:** Either add a notifications popover or remove the notification dot to avoid confusion.

---

## Pages That Load Correctly
All defined page components exist and their routes are properly mapped:
- Landing page (/) with all sections
- Auth (/auth) with login/signup toggle
- All public pages: /solutions, /docs, /tutorials, /blog, /help, /pricing, /about, /contact, /privacy, /terms
- /forgot-password, /reset-password
- /capability-statement
- All dashboard pages: /dashboard, /dashboard/search, /dashboard/tracked, /dashboard/company, /dashboard/proposals, /dashboard/proposals/generator, /dashboard/proposals/:id, /dashboard/ai, /dashboard/settings
- /onboarding
- Old route redirects all work correctly

## Buttons That Work Correctly
- Sidebar navigation links all point to valid routes
- Mobile bottom navigation links are correct
- User dropdown: Profile (/dashboard/company) and Settings (/dashboard/settings) are correct (fixed previously)
- Sign Out button works
- Search, Save, Start Bid buttons on SearchHub work
- Proposal Edit, Export (Word/Text), and Back buttons work
- Settings tabs (Profile save, Password change, Avatar upload) all work
- Capability Statement exports (Word, PDF, Text) all work

---

## Technical Implementation Plan

### Step 1: Add AuthProvider to App.tsx
Wrap the entire app with `AuthProvider` so `useAuth` works throughout.

### Step 2: Protect Dashboard Routes
Wrap all `/dashboard/*` and `/onboarding` routes with `ProtectedRoute`.

### Step 3: Fix the `/demo` Route
Add a redirect from `/demo` to `/contact` in App.tsx.

### Step 4: Fix DataSourceItem in ProposalGenerator
Replace `<a href>` with `<Link to>` in the `DataSourceItem` component.

### Step 5: Add Placeholder for Bell Icon
Add a tooltip or popover saying "Coming soon" to the notification bell, and remove the fake notification dot.

### Step 6: Update Hero/CTA Links
Change public-facing CTA buttons to link to `/auth?mode=signup` so users sign up first before accessing the dashboard.
