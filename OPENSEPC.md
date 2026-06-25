# Beda EMR — PH eReferral (FHIR Lab Philippines)

**OpenSpec — Project Specification**

---

## 1. Project Identity

### 1.1 What is this project?

A **Philippine eReferral** web application built on `@beda.software/emr`. It enables healthcare facilities to create, submit, and track electronic patient referrals between facilities within Health Care Provider Networks (HCPNs) in the Philippines.

It follows the [PH eReferral Implementation Guide v0.1](https://build.fhir.org/ig/ph-ereferral-organization/ph-ereferral/en/) and generates FHIR R4 transaction bundles matching the [ExampleERefSubmissionBundle](https://build.fhir.org/ig/ph-ereferral-organization/ph-ereferral/en/Bundle-ExampleERefSubmissionBundle.html) pattern.

The application provides:
- **Patient search** — browse/search patients from the FHIR CDR with PhilHealth ID, PhilSys ID columns
- **Patient detail** — view patient info, encounters, referral history with "New Referral" button
- **Encounter management** — list, create, and view encounters with linked clinical data (Conditions, Observations)
- **Practitioner & Organization browsing** — searchable lists with PRC IDs, NHFR codes, HCPN codes
- **eReferral submission** — a 5-step form capturing all 41 TDG data elements, building a 21-entry FHIR transaction bundle
- **Referral inbox/outbox** — view all referrals with requester/performer filtering and Task status tracking
- **Referral detail** — full referral view with Task status timeline, linked patient, encounter, conditions, audit trail

### 1.2 Who is it for?

- **End users**: Healthcare workers in the Philippines (DOH, hospitals, clinics)
- **Technical audience**: Developers customizing Beda EMR for Philippines-specific needs
- **Data model**: FHIR R4B with Philippines Department of Health (DOH) PH Core + PH eReferral profiles

### 1.3 Live URLs

| Environment | URL | Description |
|---|---|---|
| **FHIR Server (CDR)** | `https://cdr.pheref.fhirlab.net/fhir/` | Standard FHIR R4 backend (open, no auth) |
| **Local Dev EMR** | `http://localhost:3000` | Vite dev server |

### 1.4 Repository Anatomy

```
beda.fhirlab.net/
├── src/
│   ├── main.tsx              # Entry point: BaseLayout, routes, sidebar, mock auth
│   ├── containers/
│   │   ├── types.ts          # ReferralFormData + shared TS types
│   │   ├── PatientList/      # ResourceListPage<Patient> with 6 columns + 3 filters
│   │   ├── PatientDetail/    # Patient info + encounters + referral history
│   │   ├── EncounterList/    # ResourceListPage<Encounter> with 5 columns + 3 filters
│   │   ├── EncounterNew/     # Ant Design form to create encounters
│   │   ├── EncounterDetail/  # Encounter info + linked Conditions/Observations
│   │   ├── PractitionerList/ # ResourceListPage<Practitioner> with PRC license column
│   │   ├── OrganizationList/ # ResourceListPage<Organization> with NHFR/HCPN codes
│   │   ├── EReferralNew/     # 5-step form + buildReferralBundle() bundle builder
│   │   ├── EReferralList/    # Custom referrals table with requester/performer filters
│   │   └── EReferralDetail/  # Full referral + Task timeline + raw FHIR tab
│   ├── services/
│   │   ├── fhir.ts           # FHIR API helpers (search, get, post bundle)
│   │   └── i18n.ts           # Lingui i18n (English only)
│   └── locale/en/messages.po # UI strings
├── contrib/
│   ├── fhir-emr/             # Git submodule: @beda.software/emr framework
│   └── emr-config/           # Config: baseURL + fhirBaseURL
├── infra/                    # Docker, nginx, Helm chart
├── public/                   # Static assets (favicons, manifest)
├── .github/workflows/        # CI/CD
└── .opencode/                # OpenSpec AI tooling config
```

### 1.5 Key Design Philosophy

- **Thin customization layer** over `@beda.software/emr` framework
- **Standard FHIR R4** — no Aidbox-specific features (no `/$sql`, no SDC Extract)
- **Open endpoint** — no authentication, mock token bypasses EMR auth guard
- **PH eReferral IG compliance** — transaction bundles matching ExampleERefSubmissionBundle

---

## 2. Architecture

### 2.1 The Layered Design

```
┌──────────────────────────────────────────────────────────┐
│             PH eREFERRAL FRONTEND (React SPA)            │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Patient  │ │Encounter │ │eReferral │ │ Referrals │  │
│  │ List/Det │ │List/Create│ │  Form    │ │ List/Det  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────────┐                          │
│  │Practitio │ │ Organization │                          │
│  │  List    │ │    List      │                          │
│  └──────────┘ └──────────────┘                          │
│       │              │              │            │       │
│       └──────────────┼──────────────┼────────────┘       │
│                      ▼              ▼                    │
│             ┌──────────────────────────┐                 │
│             │ @beda.software/emr (core)│                 │
│             │  - BaseLayout, PageCont. │                 │
│             │  - ResourceListPage      │                 │
│             │  - getFHIRResources etc. │                 │
│             └────────────┬─────────────┘                 │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │ FHIR REST API (no auth)
                           ▼
┌──────────────────────────────────────────────────────────┐
│        FHIR CDR SERVER (cdr.pheref.fhirlab.net)          │
│  - Standard FHIR R4, 146 resource types                   │
│  - Open endpoint (no authentication)                      │
│  - Supports _total=accurate, Bundle next link pagination  │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Page loads** → `BaseLayout` renders with sidebar (5 menu items with icons)
2. **List pages** (Patients, Encounters, Practitioners, Organizations) — `ResourceListPage` uses `getFHIRResources` with `_total=accurate`; pagination follows Bundle `next` links automatically
3. **Patient detail** → fetches patient + encounters + referrals in parallel
4. **New encounter** → `createFHIRResource(encounter)` → `POST /Encounter`
5. **New eReferral** → 5-step Ant Design form → `buildReferralBundle()` generates 21-entry transaction Bundle → `POST /` (transaction endpoint). All entries use `POST` (not conditional `PUT`) to avoid "multiple matches" errors.
6. **Referral list** → `fetchAllServiceRequests()` follows Bundle `next` links to retrieve ALL pages of ServiceRequest, then fetches Tasks per referral. Filtered client-side by requester/performer text and Task status.
7. **Referral detail** → resolves linked Patient, Encounter, Conditions, Provenance via FHIR API calls.

### 2.3 External Services

| Service | URL | Purpose |
|---|---|---|
| FHIR CDR | `cdr.pheref.fhirlab.net/fhir` | Standard FHIR R4 data storage |
| Docker Registry | `ghcr.io/beda-software/beda.fhirlab.net` | Container image storage |

### 2.4 Git Submodule

```
contrib/fhir-emr/  ← git@github.com:beda-software/fhir-emr.git
```

```bash
git submodule update --init
yarn prepare  # Rebuild workspace package after submodule changes
```

---

## 3. Tech Stack

### 3.1 Core

| Technology | Version | Purpose |
|---|---|---|
| TypeScript | 5.x | Language (strict mode) |
| React | 18.x | UI framework |
| Vite | 4.x | Build tool and dev server |
| Yarn | (classic) | Package manager with workspaces |
| Ant Design (antd) | 5.x | UI component library |
| styled-components | 5.x | CSS-in-JS styling |

### 3.2 Beda/Aidbox Ecosystem

| Package | Source | Purpose |
|---|---|---|
| `@beda.software/emr` | `contrib/fhir-emr/` (git submodule) | Core EMR framework (BaseLayout, ResourceListPage, services) |
| `@beda.software/emr-config` | `contrib/emr-config/` | Config (baseURL, fhirBaseURL) |
| `@beda.software/aidbox-types` | `contrib/aidbox-types/` | TypeScript types for FHIR R4B |
| `@beda.software/fhir-react` | (via fhir-emr) | FHIR React hooks, extractBundleResources |
| `@beda.software/remote-data` | (via fhir-emr) | RemoteDataResult, isSuccess |
| `aidbox-react` | (via fhir-emr) | HTTP client (axios-based) |

### 3.3 Internationalization

Lingui 4, single English locale (`.po` files).

### 3.4 Testing & Quality

| Tool | Purpose |
|---|---|
| ESLint | Static analysis |
| Prettier | Code formatting |
| TypeScript strict | Type checking |

### 3.5 Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Local dev environment |
| Helm | Kubernetes deployment |
| nginx + certbot | Production reverse proxy |
| GitHub Actions | CI/CD |
| GitHub Container Registry | Docker image storage |

---

## 4. Source Code Walkthrough (src/)

### 4.1 Entry Point: `src/main.tsx`

Wires the application with minimal providers:

```
I18nProvider → ThemeProvider → BrowserRouter → MenuLayout.Provider → FooterLayout.Provider → BaseLayout → Routes
```

**Key design decisions:**
- **No Aidbox auth** — sets `localStorage.setItem('token', 'anonymous')` before imports, plus `sharedAuthorizedUser.setSharedState(mockUser)` to prevent Sidebar's `SharedStateInitializationError`
- **No EMR wrapper** — uses `BaseLayout` directly instead of the `EMR` component (which enforces Aidbox OAuth)
- **5 sidebar menu items**: Patients (`PatientsIcon`), Encounters (`EncountersIcon`), Practitioners (`PractitionersIcon`), Organizations (`OrganizationsIcon`), Referrals (`QuestionnairesIcon`)

### 4.2 Containers

#### PatientList (`src/containers/PatientList/`)

`ResourceListPage<Patient>` with `_total=accurate`.
- **Columns**: Name, Birth date, Gender, PhilHealth ID, PhilSys ID, Contact
- **Filters**: name (string), gender (choice: Male/Female), birth date (single date)
- **Record actions**: View → `/patients/:id`, Refer → `/referrals/new/:id`

#### PatientDetail (`src/containers/PatientDetail/`)

Fetches patient + encounters + referrals in parallel on mount.
- **Cards**: Patient Information (Descriptions), Available Encounters (table with "Refer from this visit"), Referral History
- **Header**: Back button, New Referral button

#### EncounterList (`src/containers/EncounterList/`)

`ResourceListPage<Encounter>` with `_total=accurate`.
- **Columns**: Date, Patient, Type (class), Status, Service Provider
- **Filters**: patient (string), status (choice: finished/in-progress/triaged/planned), type/class (choice: AMB/EMER/IMP/OBSENC/VRTL)
- **Header action**: New Encounter → `/encounters/new`
- **Record actions**: View → `/encounters/:id`, Refer from this → `/referrals/new/{patientId}?encounter={id}`

#### EncounterNew (`src/containers/EncounterNew/`)

Ant Design form with:
- Patient autocomplete (searches via `GET Patient?name=`)
- Status select (planned/triaged/in-progress/finished/cancelled)
- Class select (AMB/EMER/IMP/OBSENC/VRTL)
- Date picker (initialized to `dayjs()`)
- Service Provider (Organization autocomplete, optional)
- On submit: `createFHIRResource(encounter)` → navigates to encounter detail

#### EncounterDetail (`src/containers/EncounterDetail/`)

Fetches encounter + linked Conditions + Observations on mount.
- **Cards**: Encounter Details (Descriptions), Diagnoses (Conditions), Vital Signs (Observations table)
- **Header**: Back button, "Refer from this visit" button

#### PractitionerList (`src/containers/PractitionerList/`)

`ResourceListPage<Practitioner>` with `_total=accurate`.
- **Columns**: Name, PRC License (via `identifier.where(system='prc.gov.ph')`), Birth date, Gender
- **Filters**: name (string), PRC license (string)

#### OrganizationList (`src/containers/OrganizationList/`)

`ResourceListPage<Organization>` with `_total=accurate`.
- **Columns**: Name, NHFR Code, HCPN Code, Phone, Active
- **Filters**: name (string), active (choice: Yes/No)

#### EReferralNew (`src/containers/EReferralNew/`)

5-step Ant Design Form:

| Step | Title | Fields |
|---|---|---|
| 0 | Patient & Encounter | Patient name (disabled), encounter selector (dropdown from `GET Encounter?subject=Patient/{id}`), auto-loaded clinical data, encounter/referral date |
| 1 | Sending Facility | Practitioner name, PRC license, role, facility (Organization autocomplete), NHFR code, HCPN |
| 2 | Receiving Facility | Practitioner name, PRC license, facility, NHFR code, HCPN, category (Emergency/Outpatient), reason for referral |
| 3 | Clinical Details | Chief complaint, working impression (required), clinical history, clinical note, vital signs (BP/HR/RR/SpO2/Temp/Weight), treatment, lab results |
| 4 | Review & Submit | Summary Descriptions table, Submit button |

**Bundle Builder** (`bundleBuilder.ts`):
- Takes `ReferralFormData` + existing `Patient` resource
- Generates 21-entry transaction Bundle (all entries use `POST`, not conditional `PUT`)
- References within the bundle use `urn:uuid:` identifiers
- Patient entry includes existing data (fetched before building) to satisfy profile validation

**Submit flow**: `form.validateFields()` → `getFHIRResourceById('Patient', patientId)` → `buildReferralBundle(formData, existingPatient)` → `postTransactionBundle(bundle)` → navigate to `/referrals`

**Fill Test Data**: Temporary button in header populates all fields with Ana Reyes → DRSTMH test data (practitioners, facilities, vitals, clinical notes). Marked with `{/* TEMPORARY */}` comment.

#### EReferralList (`src/containers/EReferralList/`)

Custom page (not `ResourceListPage`) with:
- **Data loading**: `fetchAllServiceRequests()` follows Bundle `next` links to retrieve ALL pages of `ServiceRequest?_sort=-authored&_total=accurate&_count=100`, then fetches Tasks per referral in batches of 20
- **Filters**: 
  - Requester text input (client-side, filters `requester` column by display name or reference)
  - Performer text input (client-side)
  - Status tags: All (count), Requested, Received, Accepted, Rejected, Completed (count per status)
- **Columns**: Requisition, Patient, Date, Category, Reason, Requester, Status, Task Status (color-coded), Action

#### EReferralDetail (`src/containers/EReferralDetail/`)

Two tabs:
- **Overview**: Referral Details (Descriptions), Task Status Timeline (Ant Design Timeline with color-coded statuses), Patient Info, Encounter Info, Diagnoses, Audit Trail (Provenance)
- **Raw FHIR**: Raw ServiceRequest JSON

Resolves linked Patient, Encounter, Conditions, Provenance via `getFHIRResourceById`.

---

## 5. Route Map

| Path | Component | Sidebar Icon | Description |
|---|---|---|---|
| `/patients` | `PatientList` | PatientsIcon | Patient search/list |
| `/patients/:id` | `PatientDetail` | — | Patient details + encounters + referral history |
| `/encounters` | `EncounterList` | EncountersIcon | Encounter list with filters |
| `/encounters/new` | `EncounterNew` | — | Create encounter form |
| `/encounters/:id` | `EncounterDetail` | — | Encounter detail + linked clinical data |
| `/practitioners` | `PractitionerList` | PractitionersIcon | Practitioner search/list |
| `/organizations` | `OrganizationList` | OrganizationsIcon | Organization search/list |
| `/referrals/new/:patientId` | `EReferralNew` | — | 5-step eReferral form |
| `/referrals` | `EReferralList` | QuestionnairesIcon | Referral inbox/outbox with filters |
| `/referrals/:id` | `EReferralDetail` | — | Referral detail + Task timeline |

All routes are accessible without authentication.

---

## 6. Configuration

### 6.1 Config (`contrib/emr-config/config.local.js`)

```javascript
const config = {
    tier: 'develop',
    baseURL: 'https://cdr.pheref.fhirlab.net/fhir',
    fhirBaseURL: 'https://cdr.pheref.fhirlab.net/fhir',
};
```

The `fhirBaseURL` tells the `@beda.software/emr/services/fhir.js` module where to send FHIR requests. The active config file is `config.js` (copied from the environment variant).

### 6.2 Key Settings

- `_total=accurate` used on all list page queries for correct pagination totals
- ServiceRequest queries use `_count=100` with Bundle `next` link pagination
- Conditional `PUT` is NOT used for master data entries in bundles (changed to `POST` to avoid "Multiple resources match this search" errors caused by duplicate identifiers on the server)

---

## 7. Authentication

The FHIR CDR endpoint is **open — no authentication required**.

The EMR framework's built-in Aidbox auth guard is bypassed by:
1. Setting `localStorage.setItem('token', 'anonymous')` before framework initialization
2. Initializing `sharedAuthorizedUser.setSharedState({ resourceType: 'User', id: 'anonymous' })` to prevent sidebar's `SharedStateInitializationError`

The menu is a static 5-item list (no role matching).

---

## 8. Infrastructure

### 8.1 Docker Compose

Production compose in `infra/infra/compose.yaml` serves the EMR build via nginx with Let's Encrypt SSL.

### 8.2 CI/CD

GitHub Actions (`.github/workflows/main.yml`) builds on `v*.*.*` tags: checkout → install → build → Docker multi-arch build → push to `ghcr.io`.

### 8.3 Dockerfile

Minimal: `FROM node:lts` → `serve -s -n` on port 5000 serving the `build/` directory.

---

## 9. Development Workflow

```bash
git clone --recurse-submodules ...
cp contrib/emr-config/config.local.js contrib/emr-config/config.js
yarn install
yarn start   # Vite dev at http://localhost:3000
```

---

## 10. Appendix: Complete File Tree

```
beda.fhirlab.net/
├── .env.tpl
├── .eslintrc.cjs
├── .gitmodules                     # contrib/fhir-emr submodule
├── .husky/pre-commit               # typecheck + lint-staged
├── .opencode/                      # OpenSpec AI tooling
│   ├── commands/opsx-*.md          # propose, apply, archive, explore
│   └── skills/openspec-*/SKILL.md
├── OPENSEPC.md                     # THIS FILE
├── Dockerfile                      # node:lts + serve
├── Makefile
├── README.md
├── compose.yaml
├── contrib/
│   ├── aidbox-types/               # @beda.software/aidbox-types
│   ├── emr-config/                 # @beda.software/emr-config
│   │   ├── config.d.ts
│   │   ├── config.js               # Active config
│   │   ├── config.local.js         # Local: cdr.pheref.fhirlab.net
│   │   └── package.json
│   └── fhir-emr/                   # Git submodule (beda-software/fhir-emr)
├── index.html                      # Dev HTML entry (no aidbox-forms script)
├── index.prod.html                 # Prod HTML entry
├── lingu.config.ts
├── package.json
├── public/                         # favicons, manifest, robots.txt
├── src/
│   ├── main.tsx                    # Entry: routes, BaseLayout, mock auth
│   ├── containers/
│   │   ├── index.ts                # Exports
│   │   ├── types.ts                # ReferralFormData interface
│   │   ├── PatientList/index.tsx   # ResourceListPage<Patient>
│   │   ├── PatientDetail/index.tsx # Patient info + encounters + referrals
│   │   ├── EncounterList/index.tsx # ResourceListPage<Encounter>
│   │   ├── EncounterNew/index.tsx  # Create encounter form
│   │   ├── EncounterDetail/index.tsx # Encounter + Conditions + Observations
│   │   ├── PractitionerList/index.tsx # ResourceListPage<Practitioner>
│   │   ├── OrganizationList/index.tsx # ResourceListPage<Organization>
│   │   ├── EReferralNew/
│   │   │   ├── index.tsx            # 5-step form
│   │   │   └── bundleBuilder.ts     # 21-entry transaction bundle generator
│   │   ├── EReferralList/index.tsx  # Referral table + filters
│   │   └── EReferralDetail/index.tsx # Referral + Task timeline
│   ├── services/
│   │   ├── fhir.ts                 # FHIR API helpers
│   │   └── i18n.ts                 # Lingui setup
│   └── locale/en/messages.po
├── tsconfig.json
├── vite.config.ts
└── yarn.lock
```

---

## 11. Change Log

| Date | Change | Description |
|---|---|---|
| 2026-06-25 | Initial OpenSpec | Created this document |
| 2026-06-25 | Aidbox → FHIR CDR | Replaced Aidbox endpoint with standard FHIR, stripped OAuth/SDC/Analytics |
| 2026-06-25 | eReferral form | 5-step form + 21-entry bundle builder matching ExampleERefSubmissionBundle |
| 2026-06-25 | Encounter CRUD | List, create, detail pages for encounters with linked clinical data |
| 2026-06-25 | Practitioner/Org pages | ResourceListPage for both with enriched columns and filters |
| 2026-06-25 | Sidebar icons | PatientsIcon, EncountersIcon, PractitionersIcon, OrganizationsIcon, QuestionnairesIcon |
| 2026-06-25 | Bundle POST | Changed from conditional PUT to POST to avoid "multiple matches" errors |
| 2026-06-25 | Pagination | `_total=accurate` on all list pages, Bundle `next` link following for referrals |
| 2026-06-25 | Requester/performer filter | Two search input fields on referrals page for client-side filtering |
| 2026-06-25 | Fill Test Data | Temporary button for pre-filling form with Ana Reyes test data |

---

*This document is an OpenSpec specification. It describes the project in natural language for both human readers and AI assistants.*
