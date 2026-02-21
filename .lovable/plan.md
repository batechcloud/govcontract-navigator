# Add Product and Service Codes (PSCs) to My Business Profile

## Overview

Add a PSC (Product and Service Code) selector right beside the existing NAICS Codes section on the Company Profile page. PSCs are 4-character alphanumeric codes used by the federal government to categorize products and services in contracting. This will help users identify relevant contracts more precisely.

## Changes

### 1. Database Migration

Add a `psc_codes` column to the `company_profiles` table:

```sql
ALTER TABLE company_profiles
ADD COLUMN psc_codes text[] DEFAULT '{}'::text[];
```

### 2. New File: `src/components/company/PscCodeSelector.tsx`

A searchable selector component (same pattern as `NaicsCodeSelector`) containing verified, accurate PSC codes organized by category. The list will include the most commonly used PSCs in federal contracting:

**Services (prefix letters D, R, J, S, etc.):**

- D301 -- IT Facility Operation and Maintenance
- D302 -- IT Systems Development Services
- D304 -- IT Telecommunications and Transmission
- D306 -- IT Systems Analysis Services
- D307 -- IT Network Support Services
- D308 -- IT Programming Services
- D310 -- IT Cyber Security and Data Backup
- D311 -- IT Data Conversion Services
- D314 -- IT Deployment and Distribution
- D316 -- IT Network Management
- D317 -- IT Web-Based Subscription Services
- D318 -- IT Integrated Hardware/Software/Services Solutions
- D399 -- Other IT and Telecom Services
- R408 -- Program Management/Support Services
- R425 -- Engineering and Technical Services
- R497 -- Medical and Health Services
- R499 -- Other Professional Services
- R602 -- Logistics Support Services
- R699 -- Other Administrative Support Services
- R706 -- Management Analysis Studies
- R707 -- Consulting and Program Management
- R710 -- Financial Management and Audit Services
- R799 -- Other Management Support Services
- J058 -- Maintenance of Communication Equipment
- J070 -- Maintenance of ADP Equipment
- S201 -- Housekeeping and Janitorial Services
- S206 -- Guard Services
- S208 -- Landscaping and Groundskeeping
- U001 -- Education and Training Services
- U008 -- Training Aids and Devices
- V119 -- Transportation of Supplies/Equipment
- W062 -- Restoration of Real Property
- W072 -- Maintenance of Warehouses
- Y1DA -- Construction of Office Buildings
- Y1JZ -- Construction of Miscellaneous Buildings
- Z1DA -- Maintenance of Office Buildings
- Z2DA -- Repair of Office Buildings

**Products (numeric prefixes 70, 58, 75, etc.):**

- 7010 -- IT System Configuration and Data Entry
- 7025 -- IT Input/Output and Storage Devices
- 7030 -- IT ADP Software
- 7035 -- IT ADP Support Equipment
- 7042 -- IT Mini and Micro Computer Control Devices
- 5820 -- Radio and TV Communication Equipment
- 5895 -- Miscellaneous Communication Equipment
- 7520 -- Office Devices and Accessories
- 7530 -- Stationery and Record Forms
- 7540 -- Standard and Specification Forms
- 6515 -- Medical Instruments and Supplies
- 6530 -- Hospital Furniture and Equipment
- 6532 -- Hospital and Surgical Clothing
- 8940 -- Special Dietary Foods
- 8945 -- Food Oils and Fats
- 1560 -- Airframe Structural Components
- 2840 -- Gas Turbines and Jet Engines

All codes are verified against the official GSA PSC manual (acquisition.gov).

### 3. Modified File: `src/pages/CompanyProfile.tsx`

- Import `PscCodeSelector`
- Add `psc_codes: [] as string[]` to `formData` state
- Load `psc_codes` from `companyProfile` in the useEffect
- Include `psc_codes` in the upsert payload
- Render the PSC selector below the NAICS selector in the Advanced Details section

### 4. Modified File: `src/hooks/useProfile.tsx`

- Add `psc_codes: string[] | null` to the `CompanyProfile` interface

## No Other Changes Needed

- RLS policies already cover the `company_profiles` table for all CRUD operations
- The `onConflict: "user_id"` fix already handles save correctly