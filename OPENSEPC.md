# Beda EMR — PH eReferral (FHIR Lab Philippines)

**OpenSpec — Project Specification**

---

## 1. Project Identity

### 1.1 What is this project?

A **Philippine eReferral** web application built on `@beda.software/emr`. It enables healthcare facilities to create, submit, and track electronic patient referrals between facilities within Health Care Provider Networks (HCPNs) in the Philippines.

It follows the [PH eReferral Implementation Guide v0.1](https://build.fhir.org/ig/ph-ereferral-organization/ph-ereferral/en/) and generates FHIR R4 transaction bundles matching the [ExampleERefSubmissionBundle](https://build.fhir.org/ig/ph-ereferral-organization/ph-ereferral/en/Bundle-ExampleERefSubmissionBundle.html) pattern.

The application provides:
- **Patient search** — browse patients from the FHIR server
- **Patient detail** — view patient info, encounters, referral history
- **eReferral submission** — a 5-step form capturing all 41 TDG data elements, building a 21-entry FHIR transaction bundle
- **Referral inbox/outbox** — view sent and received referrals with Task status tracking
- **Referral detail** — full referral view with Task status timeline, linked clinical data

### 1.2 Who is it for?

- **End users**: Healthcare workers in the Philippines (DOH, hospitals, clinics)
- **Technical audience**: Developers customizing Beda EMR for Philippines-specific needs
- **Data model**: FHIR R4B with Philippines Department of Health (DOH) PH Core profiles

### 1.3 Live URLs

| Environment | URL | Description |
|---|---|---|
| **FHIR Server (CDR)** | `https://cdr.pheref.fhirlab.net/fhir/` | Standard FHIR R4 backend (open, no auth) |
| **Terminology Server** | `https://tx.fhirlab.net/fhir` | External FHIR terminology expansion |
| **Local Dev EMR** | `http://localhost:3000` | Vite dev server |

### 1.4 Repository Anatomy

```
beda.fhirlab.net/
├── src/                    # Custom application code (thin layer)
│   ├── main.tsx            # Entry point: routes, layout, providers
│   ├── containers/
│   │   ├── types.ts        # Shared TypeScript types
│   │   ├── PatientList/    # Patient search page (ResourceListPage)
│   │   ├── PatientDetail/  # Patient info + encounters + referral history
│   │   ├── EReferralNew/   # 5-step eReferral submission form + bundle builder
│   │   ├── EReferralList/  # Referral inbox/outbox with Task status filtering
│   │   └── EReferralDetail/# Referral detail with Task timeline & clinical data
│   ├── services/
│   │   ├── fhir.ts         # FHIR API client (wraps @beda.software/emr/services)
│   │   └── i18n.ts         # Internationalization
│   └── locale/             # UI strings
├── contrib/
│   ├── fhir-emr/           # Git submodule: core EMR library
│   └── emr-config/         # Environment-specific configuration
├── infra/                  # Infrastructure (Docker, nginx, Helm)
├── public/                 # Static assets
├── .github/workflows/      # CI/CD pipelines
└── .opencode/              # OpenSpec AI tooling config
```

### 1.5 Key Design Philosophy

The `src/` directory is intentionally **thin**. Most functionality comes from the `@beda.software/emr` framework. This repository focuses on:

- **eReferral workflow** — patient search, form submission, referral tracking
- **FHIR integration** — standard FHIR R4 via `https://cdr.pheref.fhirlab.net/fhir/`
- **PH eReferral IG compliance** — transaction bundles matching ExampleERefSubmissionBundle

---

## 2. Architecture

### 2.1 The Layered Design

```
┌──────────────────────────────────────────────────────────┐
│             PH eREFERRAL FRONTEND (React SPA)            │
│                                                          │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌───────┐ │
│  │ Patient   │  │ Patient   │  │ eReferral│  │ Refer-│ │
│  │ Search    │  │ Detail    │  │ Form     │  │ rals  │ │
│  └───────────┘  └───────────┘  └──────────┘  └───────┘ │
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
│           FHIR CDR SERVER (cdr.pheref.fhirlab.net)       │
│  - Standard FHIR R4                                      │
│  - 146 resource types                                     │
│  - Supports _revinclude, _include:iterate chains          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **User opens browser** → loads React SPA → BaseLayout with sidebar renders
2. **Patient search** → `GET Patient?name={query}` → results in table
3. **Patient detail** → `GET Patient/{id}` + `GET Encounter?subject=Patient/{id}` + `GET ServiceRequest?patient=Patient/{id}`
4. **New eReferral** → 5-step Ant Design form → `buildReferralBundle()` generates 21-entry transaction Bundle → `POST /` (transaction endpoint)
5. **Referral list** → queries via `_revinclude` chains to get all referrals for an organization
6. **Referral detail** → resolves linked Patient, Encounter, Conditions via FHIR API

### 2.3 External Services

| Service | URL | Purpose |
|---|---|---|
| FHIR CDR | `cdr.pheref.fhirlab.net/fhir` | Standard FHIR R4 data storage |
| Terminology Server | `tx.fhirlab.net/fhir` | SNOMED CT, LOINC value set expansion |
| Docker Registry | `ghcr.io/beda-software/beda.fhirlab.net` | Container image storage |

### 2.4 Git Submodule Dependency

The core EMR library (`@beda.software/emr`) is a **git submodule** at `contrib/fhir-emr/`.

```
contrib/fhir-emr/  ← git@github.com:beda-software/fhir-emr.git
```

When modifying the core framework, changes go inside `contrib/fhir-emr/`, then:
```bash
yarn prepare      # Rebuilds the workspace package
```
Changes to the submodule must be committed separately and pushed to the upstream repository.

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
| Recharts | 2.x | Charts (PieChart for analytics) |

### 3.2 Beda/Aidbox Ecosystem

| Package | Source | Purpose |
|---|---|---|
| `@beda.software/emr` | `contrib/fhir-emr/` (git submodule) | Core EMR framework |
| `@beda.software/emr-config` | `contrib/emr-config/` | Environment config |
| `@beda.software/aidbox-types` | `contrib/aidbox-types/` | TypeScript types for Aidbox |
| `@beda.software/fhir-react` | (via fhir-emr) | FHIR React hooks and utilities |
| `@beda.software/remote-data` | (via fhir-emr) | Remote data state management |

### 3.3 Internationalization

| Tool | Purpose |
|---|---|
| Lingui v4 | i18n framework |
| `.po` files | Message catalog format |
| `make-plural` | Plural rule support |
| Single locale: `en` | English only (currently) |

### 3.4 Testing & Quality

| Tool | Purpose |
|---|---|
| Storybook 8.x | Component development and visual testing |
| Chromatic | Visual regression testing |
| Vitest | Unit testing |
| Testing Library | React component testing |
| ESLint | Static analysis (strict rules) |
| Prettier | Code formatting |
| Husky + lint-staged | Pre-commit hooks (typecheck + lint-staged) |

### 3.5 Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Local development environment |
| Helm | Kubernetes deployment |
| nginx + certbot | Production reverse proxy with Let's Encrypt |
| GitHub Actions | CI/CD |
| GitHub Container Registry | Docker image storage |

---

## 4. Source Code Walkthrough (src/)

### 4.1 Entry Point: `src/main.tsx`

Wires together the application with minimal providers:

```
I18nProvider
  → ThemeProvider
    → BrowserRouter
      → MenuLayout.Provider
        → FooterLayout.Provider
          → BaseLayout
            → Routes (5 routes)
```

**Key differences from the original Beda EMR template:**

- **No Aidbox auth** — removed `getAuthorizeUrl`, `getUserInfo`, `populateUserInfoSharedState`, `SignIn` component
- **No SDC/Questionnaire** — removed `AidboxFormsBuilder`, SDC Extract flow, `ValueSetExpandProvider`
- **No role-based menu** — static 2-item menu: Patients, Referrals
- **No Analytics** — removed `/analytics-ph` route and `/$sql` usage
- **Uses `BaseLayout` directly** — bypasses the `EMR` component's built-in Aidbox auth check

The `@beda.software/emr/dist/services/initialize` is still imported to ensure the framework services are initialized.

### 4.2 Container Components (`src/containers/`)

The application has 5 container components, organized around the eReferral workflow:

#### 4.2.1 `PatientList` (`src/containers/PatientList/`)

Uses the `ResourceListPage<Patient>` generic component from `@beda.software/emr`:
- **Table columns**: Name, Birth date, Gender
- **Filters**: name string search
- **Actions**: "New Referral" button per row → navigates to `/referrals/new/:patientId`
- No edit/create actions (patient data is read-only from the FHIR server)

#### 4.2.2 `PatientDetail` (`src/containers/PatientDetail/`)

Shows patient information, available encounters, and referral history:
- **Patient info card**: name, gender, birth date, contact, address
- **Encounters table**: date, type (class), status, with "Refer from this visit" action
- **Referral history table**: date, status, reason, with "View" action
- Data fetched in parallel via `getPatient()`, `getPatientEncounters()`, `getPatientReferrals()`

#### 4.2.3 `EReferralNew` (`src/containers/EReferralNew/`)

The core component — a 5-step Ant Design form:

**Step 1 — Patient & Encounter**: Shows patient name (pre-filled), encounter selector (dropdown from `GET Encounter?subject=Patient/{id}`), auto-loads clinical data (Conditions, Observations) from selected encounter, encounter/referral date pickers

**Step 2 — Sending Facility**: Practitioner name + PRC license, facility autocomplete (searches `Organization`), NHFR code, HCPN name

**Step 3 — Receiving Facility**: Receiving practitioner + PRC, facility autocomplete, NHFR code, HCPN name, referral category (Emergency/Outpatient), reason for referral

**Step 4 — Clinical Details**: Chief complaint, working impression, clinical history, clinical note, vital signs (BP, HR, RR, SpO2, Temp, Weight), treatment given, lab results

**Step 5 — Review & Submit**: Summary table of all entered data, "Submit Referral" button

**On submit**: `buildReferralBundle()` generates a 21-entry transaction Bundle → `POST /` to FHIR server

#### 4.2.4 `EReferralList` (`src/containers/EReferralList/`)

Referral inbox/outbox:
- **Tabs**: All, Requested, Received, Accepted, Rejected, Completed
- **Table**: Patient, Date, Category, Reason, Status, Task Status
- **Action**: View → navigates to referral detail
- **Header**: "New Referral" button → navigates to patient selection
- Queries via `getPatientReferrals()` for each patient + `getReferralTasks()` for Task status

#### 4.2.5 `EReferralDetail` (`src/containers/EReferralDetail/`)

Full referral view with two tabs:
- **Overview tab**: Referral details (Descriptions table), Task status timeline, Patient info, Encounter info, Diagnoses, Audit trail
- **Raw FHIR tab**: Raw `ServiceRequest` JSON for debugging
- Resolves linked Patient, Encounter, Conditions, Provenance via FHIR API

### 4.3 Services (`src/services/i18n.ts`)

Internationalization setup:
- Loads English locale with plural rules
- Merges messages from `@beda.software/emr` core with local messages
- Locale preference stored in `localStorage`
- Only English is configured (single locale)

### 4.4 Locale (`src/locale/en/messages.po`)

Contains all UI strings used across the application:
- Navigation labels (Patients, Encounters, etc.)
- Button labels (Add patient, Create encounter, etc.)
- Filter placeholders (Find patient, Choose gender, etc.)
- Column headers (Name, Birth date, Status, etc.)
- Analytics labels (Gender, Birth Date, Immunization dashboard, etc.)
- Report titles (Number of Patients, Number of Encounters, etc.)
- Dashboard labels (IPS Bundle copied, Share, etc.)

### 4.5 Components (`src/components/`)

Currently an empty placeholder — no custom components have been created yet.

### 4.6 Stories (`src/stories/`)

Default Storybook stories (Button, Header, Page) from the Vite template setup, plus MDX documentation files (Configure.mdx, GetStarted.mdx).

---

## 5. The "UberList" Pattern

This is the central architectural pattern used by every resource list page. Understanding it is key to modifying or adding new resource types.

### 5.1 What is `ResourceListPage<T>`?

A generic component from `@beda.software/emr` that provides:

```
ResourceListPage<T extends FHIRResource>
  ├── Header (title, action buttons)
  ├── Search Bar (filters)
  ├── Table (columns with sorting)
  └── Footer (report, summary)
```

### 5.2 Props Breakdown

| Prop | Type | Description |
|---|---|---|
| `headerTitle` | string | Page title displayed in header |
| `resourceType` | string | FHIR resource type (e.g., "Patient", "Encounter") |
| `searchParams` | object | Default FHIR search parameters (e.g., `{ profile: '...' }`) |
| `getTableColumns` | `() => Column[]` | Defines table columns with custom render functions |
| `getFilters` | `() => Filter[]` | Defines search bar and table filters |
| `getRecordActions` | `(record) => Action[]` | Row-level actions (Edit, Open, Delete) |
| `getHeaderActions` | `() => Action[]` | Page-level actions (Add, Create) |
| `getReportColumns` | `(bundle) => ReportColumn[]` | Summary report shown at bottom of table |

### 5.3 Filter Types

| Type | Description |
|---|---|
| `SearchBarColumnType.STRING` | Text input — maps to `name`, `_ilike`, or chained params like `patient:Patient.name` |
| `SearchBarColumnType.CHOICE` | Dropdown — maps to status or choice params with Coding values |
| `SearchBarColumnType.SINGLEDATE` | Single date picker — maps to date params like `birthdate` |
| `SearchBarColumnType.REFERENCE` | Reference search — used for related resources with expression path |

Each filter has a `placement` array: `['search-bar', 'table']` controls where it appears.

### 5.4 Action Types

| Type | Creator | Description |
|---|---|---|
| Navigation | `navigationAction(label, path)` | Navigates to a URL |
| Questionnaire | `questionnaireAction(label, id, options)` | Opens a FHIR Questionnaire for CRUD |
| Custom | Manual | Define your own action |

Questionnaire actions include:
- `launchContextParameters` — passes context resources (e.g., the current Patient record) to the dynamic form
- Editing pre-fills the questionnaire with existing resource data
- Creating uses an empty resource template

### 5.5 FHIRPath Extraction

The project uses `compileAsFirst` and `compileAsArray` from `@beda.software/emr/utils` to extract values from FHIR resources using FHIRPath expressions.

**How it works:**

```typescript
// compileAsFirst extracts first matching value
const getPhilHealthId = compileAsFirst<Patient, string>(
    "Patient.identifier.where(system='http://philhealth.gov.ph/fhir/Identifier/philhealth-id').value"
);

// Used in table columns:
render: (_text, { resource }) => getPhilHealthId(resource) ?? ''
```

These FHIRPath expressions are used for:
- Extracting identifiers (PhilHealth ID, PhilSys ID, NHFR code)
- Extracting display labels from references (practitioner name, organization name)
- Computing display values (vaccine code text, observation value descriptions)
- Chained fallbacks using `|` operator

---

## 6. FHIR Profiles (PH Core Philippines)

Every resource list page filters by a Philippines-specific FHIR profile. These profiles are defined in the **PH Core Implementation Guide** (`https://fhir.doh.gov.ph/phcore/`).

| Resource | Profile URL |
|---|---|
| Patient | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-patient` |
| Encounter | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-encounter` |
| Immunization | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-immunization` |
| Observation | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-observation` |
| Medication | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-medication` |
| Procedure | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-procedure` |
| Organization | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-organization` |
| Practitioner | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-practitioner` |
| PractitionerRole | `https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-practitionerrole` |

The profile is passed as a search parameter:
```typescript
searchParams={{ profile: "https://fhir.doh.gov.ph/phcore/StructureDefinition/ph-core-patient" }}
```

This tells Aidbox to return only resources that conform to the specified profile.

---

## 7. Seed Data & Questionnaires (resources/)

### 7.1 Structure

```
resources/
├── seeds/                    # FHIR test data (loaded on startup)
│   ├── Patient/
│   ├── Practitioner/
│   ├── Organization/
│   ├── Encounter/
│   ├── Immunization/
│   ├── Observation/
│   ├── Medication/
│   ├── MedicationStatement/
│   ├── Procedure/
│   ├── Condition/
│   ├── AllergyIntolerance/
│   ├── Location/
│   ├── HealthcareService/
│   ├── Questionnaire/        # 10 dynamic forms
│   ├── Mapping/              # 10 SDC FHIRPath transforms
│   ├── Client/               # OAuth client definitions
│   ├── Role/                 # User role definitions
│   ├── AccessPolicy/         # Access control policies
│   ├── AidboxQuery/          # Predefined SQL queries
│   └── SDCConfig/            # SDC configuration
├── ig0/
│   └── CodeSystem/           # PH Core code systems
├── ig1/
│   └── ValueSet/             # PH Core value sets
└── init-bundles/             # Generated init bundles (git-ignored)
```

### 7.2 Seed Data Purpose

Seed data is loaded into Aidbox when the backend starts up (via `build-seeds` service). It serves as:
- **Example data** for development and testing
- **Configuration resources** (Clients, Roles, AccessPolicies) that define how the system works
- **Questionnaires** that provide dynamic forms for CRUD operations on each resource type

### 7.3 OAuth Client: `resources/seeds/Client/web.yaml`

```yaml
auth:
  implicit:
    redirect_uri: "${FHIR_EMR_AUTH_URL}"
first_party: true
grant_types:
  - implicit
id: web
resourceType: Client
```

The redirect URI is injected at build time via environment variable. This enables the OAuth implicit grant flow used by the SignIn page.

### 7.4 Role & Access Policy

**Role** (`resources/seeds/Role/admin.yaml`):
```yaml
name: admin
user:
  reference: User/admin
links:
  organization:
    reference: Organization/beda-emr
```

**AccessPolicy** (`resources/seeds/AccessPolicy/admin-policy.yaml`):
```yaml
engine: allow
roleName: admin
```

This means any user with the "admin" role has full access to all resources. The policy is named `admin-policy`.

### 7.5 Questionnaires (10 total)

Each questionnaire corresponds to a resource type and is used for both **create** and **edit** operations:

| Questionnaire ID | Target Resource | File |
|---|---|---|
| `patient-create-connectathon` | Patient | `resources/seeds/Questionnaire/patient-create-connectathon.yaml` |
| `encounter-create-connectathon` | Encounter | `resources/seeds/Questionnaire/encounter-create-connectathon.yaml` |
| `immunization-create-connectathon` | Immunization | `resources/seeds/Questionnaire/immunization-create-connectathon.yaml` |
| `observation-create-connectathon` | Observation | `resources/seeds/Questionnaire/observation-create-connectathon.yaml` |
| `medication-create-connectathon` | Medication | `resources/seeds/Questionnaire/medication-create-connectathon.yaml` |
| `procedure-create-connectathon` | Procedure | `resources/seeds/Questionnaire/procedure-create-connectathon.yaml` |
| `organization-create-connectathon` | Organization | `resources/seeds/Questionnaire/organization-create-connectathon.yaml` |
| `practitioner-create-connectathon` | Practitioner | `resources/seeds/Questionnaire/practitioner-create-connectathon.yaml` |
| `practitionerrole-create-connectathon` | PractitionerRole | `resources/seeds/Questionnaire/practitionerrole-create-connectathon.yaml` |
| `curated-ips` | IPS (International Patient Summary) | `resources/seeds/Questionnaire/curated-ips.yaml` |

**Patient questionnaire** (`patient-create-connectathon.yaml`) is the most complex (501 lines), with fields for:
- Basic demographics (name, gender, birth date)
- Nationality, religion
- Indigenous group, race
- Identifier: PhilHealth ID, PhilSys ID
- Education level, occupation
- Address with PSGC geographic codes (region, province, city/municipality)
- Emergency contacts

### 7.6 SDC Mappings (10 total)

Each questionnaire has a corresponding **SDC Mapping** that transforms `QuestionnaireResponse` answers into FHIR resources via FHIRPath expressions:

| Mapping ID | Target Resource |
|---|---|
| `patient-create-connectathon` | Patient |
| `encounter-create-connectathon` | Encounter |
| `immunization-create-connectathon` | Immunization |
| (and so on for each resource type) | |

Mappings use a Liquid-like template syntax:
- `{% assign %}` — set variables
- `{% if %}` — conditional logic
- `{% for %}` — iterate arrays
- `{% merge %}` — merge into existing or create new

---

## 8. Route Map

| Path | Component | Description |
|---|---|---|
| `/patients` | `PatientList` | Patient search/list (ResourceListPage) |
| `/patients/:id` | `PatientDetail` | Patient details + encounters + referral history |
| `/referrals/new/:patientId` | `EReferralNew` | 5-step eReferral submission form |
| `/referrals` | `EReferralList` | Referral inbox/outbox with Task status tabs |
| `/referrals/:id` | `EReferralDetail` | Full referral detail + Task timeline + raw FHIR |

All routes are accessible without authentication. The app uses `BaseLayout` directly (bypassing the EMR component's built-in Aidbox auth flow).

---

## 9. Configuration

### 9.1 Environment-Specific Config (`contrib/emr-config/`)

Minimal config pointing to the FHIR CDR:

```javascript
const config = {
    tier: 'develop',
    baseURL: 'https://cdr.pheref.fhirlab.net/fhir',
    fhirBaseURL: 'https://cdr.pheref.fhirlab.net/fhir',
};
```

| File | `baseURL` | `fhirBaseURL` |
|---|---|---|
| `config.local.js` | `https://cdr.pheref.fhirlab.net/fhir` | Same |
| `config.js` (active) | `https://cdr.pheref.fhirlab.net/fhir` | Same |

The `fhirBaseURL` property tells the `@beda.software/emr/services/fhir.js` module where to send FHIR requests. All old Aidbox-specific config (clientId, sdcIdeUrl, jitsiMeetServer, etc.) has been removed.

### 9.2 Environment Variables (`env/` directory)

| File | Service | Key Variables |
|---|---|---|
| `env/aidbox` | Aidbox FHIR server | `BOX_INIT_BUNDLE`, `BOX_FHIR_SCHEMA_VALIDATION=true`, `BOX_FHIR_COMPLIANT_MODE=true`, `BOX_DB_HOST`, `BOX_DB_USER`, `BOX_DB_PASSWORD`, `BOX_ROOT_CLIENT_ID=root`, `BOX_ROOT_CLIENT_SECRET=secret`, `BOX_SECURITY_DEV_MODE=true`, `BOX_FHIR_TERMINOLOGY_ENGINE=hybrid`, `BOX_FHIR_TERMINOLOGY_ENGINE_HYBRID_EXTERNAL_TX_SERVER` |
| `env/db` | PostgreSQL | `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=aidbox` |
| `env/sdc` | SDC service | `APP_INIT_CLIENT_ID=root`, `APP_INIT_CLIENT_SECRET=secret` |
| `env/build-seeds` | Seed builder | `FHIR_EMR_AUTH_URL`, `SDC_IDE_AUTH_URL` |
| `env/ingestion` | Wearable data ingestion | TimescaleDB config, `EMR_WEB_URL` |
| `env/testscript` | Test script runner | `FHIR_SERVER_BASE_URL`, Basic auth |

### 9.3 `.env.tpl` (Root)

Template for local development:
```
AIDBOX_LICENSE=                   # Required for Aidbox
TSC_COMPILE_ON_ERROR=true
ESLINT_NO_DEV_ERRORS=true
```

### 9.4 Key Aidbox Config (`env/aidbox`)

- `BOX_FHIR_SCHEMA_VALIDATION=true` — validates FHIR resources against schema
- `BOX_FHIR_COMPLIANT_MODE=true` — FHIR-compliant behavior
- `BOX_FHIR_TERMINOLOGY_ENGINE=hybrid` — uses both internal and external terminology
- `BOX_FHIR_TERMINOLOGY_ENGINE_HYBRID_EXTERNAL_TX_SERVER` — points to `https://tx.fhirlab.net/fhir`
- `BOX_INIT_BUNDLE="file:///resources/init-bundles/initBundle.json"` — loads seed data on startup
- `BOX_SECURITY_DEV_MODE=true` — disables security for development

---

## 10. Authentication

The FHIR CDR endpoint (`https://cdr.pheref.fhirlab.net/fhir/`) is **open — no authentication required**. All routes are publicly accessible.

The EMR framework's built-in Aidbox OAuth flow (implicit grant, `getAuthorizeUrl`, `getUserInfo`, role-based menu) has been bypassed. The app uses `BaseLayout` directly instead of the `EMR` wrapper component.

The menu is a static list:
- Patients (`/patients`)
- Referrals (`/referrals`)

---

## 11. Infrastructure

### 11.1 Docker Compose for Local Development (`compose.yaml`)

7 services orchestrated for local development:

```
compose.yaml
├── devbox-db                  # PostgreSQL 18 (Aidbox database)
├── build-seeds                # Generates init bundle from seeds
├── devbox                     # Aidbox FHIR server (port 8080)
├── sdc                        # SDC engine (port 8081)
├── watch-seeds                # Watches seeds, syncs to Aidbox
└── questionnaire-fce-fhir-converter  # Questionnaire format converter
```

**Startup order:**
1. `devbox-db` — PostgreSQL (healthcheck: pg_isready)
2. `build-seeds` — generates `initBundle.json` from seed files (exits when done)
3. `devbox` — Aidbox server (healthcheck: curl /health)
4. `sdc` — SDC engine (depends on devbox healthy)

**Seed building (`build-seeds`):**
```bash
fhirsnake export
  --input /app/resources/ig0
  --input /app/resources/ig1
  --input /app/resources/seeds
  --output /app/init-bundles/initBundle.json
```

This combines Implementation Guide profiles (ig0, ig1) with seed data into a single init bundle that Aidbox loads on startup.

**Seed watching (`watch-seeds`):**
Continuously monitors seed files and syncs changes to Aidbox — useful for development without restarting.

### 11.2 Makefile

| Command | Description |
|---|---|
| `make up` | Pull images, build, start services with `dev` profile |
| `make stop` | Stop services |
| `make down` | Tear down all services |
| `make aidbox` | Start only the Aidbox service |

### 11.3 Production Infrastructure (`infra/infra/`)

**Docker Compose** (`infra/infra/compose.yaml`):
- nginx reverse proxy + certbot (Let's Encrypt)
- Ports 80 (HTTP → certbot) and 443 (HTTPS with SSL)
- EMR build files mounted at `/www/emr`

**Nginx Configs:**

`emr.conf` — serves the EMR SPA:
```nginx
location / {
    root /www/emr;
    try_files $uri /index.html;  # SPA fallback
}
```

`aidbox.conf` — proxies Aidbox API requests:
- Redirects `aidbox.ph.beda.software` → `aidbox.emr.beda.software` (301)
- Proxies `aidbox.emr.beda.software` → local Aidbox instance at port 8080
- SSL with Let's Encrypt certificates
- TLS 1.3 only, strong ciphers

### 11.4 Helm Chart (`infra/helm/ph-core-emr/`)

Kubernetes deployment for production:

```
ph-core-emr/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── emr.yaml          # EMR frontend deployment
    ├── sdc.yaml          # SDC service deployment
    └── converter.yaml    # Questionnaire converter deployment
```

Images are pulled from:
- EMR: `ghcr.io/beda-software/beda.fhirlab.net`
- SDC: `bedasoftware/fhir-sdc:2.1.0a6`
- Converter: `bedasoftware/questionnaire-fce-fhir-converter:latest`

### 11.5 Dockerfile (Production)

Minimal production image:
```dockerfile
FROM node:lts
RUN yarn global add serve
COPY /build /app
WORKDIR /app
EXPOSE 5000
CMD serve -s -n -l tcp://0.0.0.0:5000
```

Build output from `vite build` is served statically via `serve`.

### 11.6 CI/CD Pipeline (`.github/workflows/main.yml`)

**Trigger**: Push tags matching `v*.*.*`

**Pipeline steps:**
1. Checkout with submodules (recursive)
2. Setup Node 20
3. Copy production config (`config.production.js` → `config.js`)
4. Copy production HTML template (`index.prod.html` → `index.html`)
5. Install dependencies with `yarn install --network-concurrency 1`
6. Extract and compile i18n messages
7. Build with TypeScript + Vite
8. Setup QEMU + Docker Buildx for multi-arch builds
9. Login to GitHub Container Registry
10. Build and push Docker image (linux/amd64 + linux/arm64)
11. Tag: `v0.3.4` → Docker image tagged `0.3.4`

---

## 12. Patient Dashboard

The patient dashboard (`src/containers/PatientsUberList/dashboard.tsx`) provides a clinical overview of a single patient with 5 card sections. Each card is rendered by `StandardCardContainerFabric` and queries data scoped to the patient.

### 12.1 Card: Composition

- Shows documents/clinical notes for the patient
- Columns: Title, Date, Share
- **Share button**: Prepares an IPS (International Patient Summary) Bundle and copies it to clipboard as JSON
- Queries with `_include` to bring in related resources (Patient, entry resources)

### 12.2 Card: Encounters

- Shows recent encounters (max 7)
- Columns: Status, Date (period format), Practitioner, Organization
- Reuses `getPractitioner` and `getOrganization` from EncountersUberList

### 12.3 Card: Immunizations

- Shows recent immunizations (max 7)
- Columns: Status, Date (occurrenceDateTime), Vaccine (text), Performer
- Reuses `getPerformers` from ImmunizationsUberList

### 12.4 Card: Observations

- Shows recent observations (max 7)
- Columns: Status, Date (effectiveDateTime), Code, Value
- Reuses `getObservationCode` and `getObservationValue` from ObservationsUberList

### 12.5 Card: Procedures

- Shows recent procedures (max 7)
- Columns: Status, Code
- Includes fallback display for code (text → coding display)

### 12.6 IPS Bundle Prep (utils.ts)

The `prepareIPSBundle()` function:
1. Takes a Composition and its related resources bundle
2. Extracts Patient, Condition, AllergyIntolerance, MedicationStatement, Immunization, Procedure
3. Builds a FHIR Bundle of type `document`
4. Sets profile to `http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips`
5. Generates UUID identifier
6. Returns the complete Bundle ready for clipboard copy

---

## 13. Analytics System

### 13.1 Overview

The analytics page (`src/containers/Analytics/index.tsx`) provides an interactive immunization dashboard with:
- Pie chart of immunizations grouped by vaccine code
- Gender and birth date range filters
- Drill-down detail on click

### 13.2 Data Query (hooks.ts)

Uses **raw SQL queries** via the Aidbox `/$ql` endpoint:

**Main query** (groups immunizations by vaccine):
```sql
SELECT
  i.resource#>>'{vaccineCode,coding,0,display}' AS title,
  i.resource#>>'{vaccineCode,coding,0,code}' AS code,
  COUNT(i.id)
FROM immunization i
JOIN patient p ON i.resource#>>'{patient,id}' = p.id
[WHERE filters]
GROUP BY title, code
```

**Detail query** (drills into specific vaccine):
```sql
WITH filtered_patients AS (
  SELECT id FROM patient [WHERE filters]
)
SELECT
  (SELECT COUNT(*) FROM filtered_patients) AS total_patients,
  (SELECT COUNT(DISTINCT i.resource#>>'{patient,id}')
   FROM immunization i
   JOIN filtered_patients fp ON i.resource#>>'{patient,id}' = fp.id
   WHERE i.resource#>>'{vaccineCode,coding,0,code}' = ?)
  AS vaccinated_patients
```

Both queries use **parameterized SQL** (the `?` placeholders) to prevent injection. Parameters are dynamically constructed based on filter state.

### 13.3 Filters

| Filter | Type | Values |
|---|---|---|
| Gender | Select (single, clearable) | Male, Female, Other, Unknown |
| Birth Date | Range picker | Start date → End date |

### 13.4 Visualization

- Uses **Recharts PieChart** with `ResponsiveContainer`
- Colors: 6-color palette (`#0088FE`, `#00C49F`, `#FFBB28`, `#FF8042`, `#8884D8`, `#82CA9D`)
- Hover tooltip shows count
- Click on slice → shows detail table (Total patients vs Vaccinated patients)
- Legend below chart shows label + terminology code + color indicator

---

## 14. SDC (Structured Data Capture)

### 14.1 What is SDC?

FHIR's **Structured Data Capture** (SDC) framework allows dynamic form generation from Questionnaires. Beda EMR uses SDC for all CRUD operations.

### 14.2 The Extract Flow

```
User fills questionnaire → QuestionnaireResponse
                              ↓
                    POST /QuestionnaireResponse/$extract
                              ↓
                        Parameters (questionnaire + qr)
                              ↓
                    SDC Engine processes FHIRPath Mapping
                              ↓
                    Returns extracted Bundle of FHIR resources
                              ↓
                    POST / (batch/transaction)
                              ↓
                    Resources saved to Aidbox
```

This flow is implemented in `detail.tsx` in the `sdcExtract` function:
1. Fetch the questionnaire definition by URL
2. Call `QuestionnaireResponse/$extract` with the questionnaire and response
3. Extract the return Bundle from the Parameters response
4. Post the Bundle to the root endpoint (which handles batch/transaction)

### 14.3 Auto-Save

In the Documents tab, the `PatientDocument` component has `autoSave={true}`, which automatically saves the QuestionnaireResponse as the user fills it in.

### 14.4 Aidbox Forms Builder

Questionnaire creation and editing use the **Aidbox Forms Builder** web component:

```html
<script src="https://aidbox.fhirlab.net/static/aidbox-forms-builder-webcomponent.js"></script>
```

Routes:
- `/questionnaires-ph/aidbox-forms-builder/new` — create new questionnaire
- `/questionnaires-ph/aidbox-forms-builder/:id/edit` — edit existing questionnaire

### 14.5 SDC Service in Docker

The `sdc` Docker service (`bedasoftware/fhir-sdc:2.1.0a6`) runs alongside Aidbox and handles the `$extract` operation. It depends on Aidbox being healthy.

---

## 15. Development Workflow

### 15.1 Initial Setup

```bash
# 1. Clone with submodules
git clone --recurse-submodules git@github.com:beda-software/beda.fhirlab.net.git

# Or if already cloned:
git submodule update --init

# 2. Copy local config
cp contrib/emr-config/config.local.js contrib/emr-config/config.js

# 3. Copy environment template
cp .env.tpl .env
# Edit .env and add your AIDBOX_LICENSE

# 4. Install dependencies
yarn install

# 5. Build locales
yarn compile

# 6. Start backend
make up        # Docker Compose (Aidbox + PostgreSQL + SDC)
# Wait for Aidbox to be healthy (check http://localhost:8080)

# 7. Start frontend
yarn start     # Vite dev server at http://localhost:3000
```

### 15.2 Development Cycle

1. Edit code in `src/` (the customization layer)
2. Changes are hot-reloaded via Vite (HMR)
3. For changes to `@beda.software/emr` (in `contrib/fhir-emr/`):
   ```bash
   yarn prepare   # Rebuild workspace package
   ```
4. For seed data changes: `watch-seeds` auto-syncs to Aidbox

### 15.3 Adding a New Resource Page

To add a new FHIR resource type:

1. **Create container directory** at `src/containers/<Resource>UberList/index.tsx`
2. **Implement using `ResourceListPage<T>`** pattern:
   - Set `headerTitle`, `resourceType`, `searchParams` with profile
   - Define table columns with FHIRPath extractors
   - Define filters (string, choice, date, reference)
   - Define actions (questionnaireAction for CRUD)
3. **Create a Questionnaire** at `resources/seeds/Questionnaire/<resource>-create-connectathon.yaml`
4. **Create an SDC Mapping** at `resources/seeds/Mapping/<resource>-create-connectathon.yaml`
5. **Add seed data example** at `resources/seeds/<Resource>/`
6. **Register route** in `src/main.tsx` (both import and authenticatedRoutes)
7. **Add menu item** in `menuLayout()` function
8. **Add i18n strings** to `src/locale/en/messages.po`

### 15.4 Database Changes

There is **no traditional database schema** — all data is FHIR-based. Changes to the data model mean:
- Creating new FHIR profiles (in the IG)
- Creating new Questionnaire + Mapping pairs
- Adding seed data

### 15.5 Building for Production

```bash
cp contrib/emr-config/config.production.js contrib/emr-config/config.js
cp index.prod.html index.html
yarn extract
yarn compile
yarn build   # Outputs to build/
docker build -t beda.fhirlab.net .
```

### 15.6 Linting & Code Quality

Pre-commit hooks (Husky + lint-staged) run:
1. `typecheck` — TypeScript compiler check
2. `lint-staged` — ESLint --fix + Prettier --write on staged files

Manual checks:
```bash
yarn lint           # ESLint (max-warnings 0)
yarn typecheck      # TypeScript
```

### 15.7 i18n Workflow

```bash
yarn extract   # Scans source for translatable strings → updates .po files
# Edit .po files with translations
yarn compile   # Compiles .po → TypeScript
```

### 15.8 Storybook

```bash
yarn storybook   # Dev server at http://localhost:6006
```

### 15.9 Common Pitfalls

**TS/ESLint import errors**:
- Use `@beda.software/emr` not relative paths to `contrib/fhir-emr/`
- Add `type` keyword for type-only imports from `@beda.software/emr/dist/`
- The ESLint `no-restricted-imports` rule blocks direct imports from `contrib/` directories

---

## 16. Appendix: Complete File Tree

```
beda.fhirlab.net/
│
├── .env.tpl                          # Aidbox license template
├── .eslintignore                     # ESLint ignore rules
├── .eslintrc.cjs                     # ESLint config (strict, React + TS + import ordering)
├── .git-blame-ignore-revs            # Revisions to skip in blame
├── .gitignore
├── .gitmodules                       # contrib/fhir-emr submodule
├── .husky/pre-commit                 # typecheck + lint-staged
├── .lintstagedrc                     # ESLint fix + Prettier on staged
├── .prettierignore
├── .prettierrc.json                  # Single quotes, trailing commas, tab width 4
├── .storybook/
│   ├── main.ts                       # Storybook config (React Vite, stories location)
│   └── preview.ts                    # Storybook preview config
├── OPENSEPC.md                       # THIS FILE
├── Dockerfile                        # Production: node:lts + serve + build/
├── Makefile                          # Docker Compose shortcuts (up/down/stop/aidbox)
├── README.md                         # Project documentation (outdated)
├── compose.yaml                      # Dev: 7 Docker services
├── contrib-env.d.ts                  # TypeScript ambient declarations
├── contrib/
│   ├── aidbox-types/                 # @beda.software/aidbox-types (workspace)
│   │   ├── index.d.ts               # Large FHIR + Aidbox type definitions
│   │   └── package.json
│   ├── emr-config/                   # @beda.software/emr-config (workspace)
│   │   ├── config.d.ts
│   │   ├── config.js                # Active config (copied from env variant)
│   │   ├── config.local.js          # Local dev: localhost:8080
│   │   ├── config.dev.js            # Dev: aidbox.fhirlab.net, web-local client
│   │   ├── config.production.js     # Production: aidbox.fhirlab.net, web client
│   │   └── package.json
│   └── fhir-emr/                    # Git submodule (bedasoftware/fhir-emr)
│                                    # @beda.software/emr workspace package
│
├── env/
│   ├── aidbox                       # Aidbox config (schema validation, terminology, DB)
│   ├── build-seeds                  # Seed builder env vars
│   ├── db                           # PostgreSQL creds
│   ├── ingestion                    # Wearable data ingestion
│   ├── sdc                          # SDC service config
│   └── testscript                   # Test runner config
│
├── index.html                       # Development HTML entry
├── index.prod.html                  # Production HTML entry (Sentry CSP, meta tags)
├── lingui.config.ts                 # Lingui: English only, PO format
├── package.json                     # Workspace root, scripts
├── public/                          # Favicons, PWA icons, robots.txt, manifest
│
├── resources/
│   ├── seeds/
│   │   ├── Patient/                 # patient-single-ex.yaml
│   │   ├── Practitioner/            # practitioner-single-ex.yaml
│   │   ├── Organization/            # beda-emr.yaml, organization-single-ex.yaml
│   │   ├── Encounter/               # encounter-single-ex.yaml
│   │   ├── Immunization/            # immunization-single-ex.yaml
│   │   ├── Observation/             # observation-single-ex.yaml
│   │   ├── Medication/              # medication-single-ex.yaml
│   │   ├── MedicationStatement/     # medication-statement-single-ex.yaml
│   │   ├── Procedure/               # procedure-single-ex.yaml
│   │   ├── Condition/               # condition-single-ex.yaml, ex-1.yaml
│   │   ├── AllergyIntolerance/      # allergy-single-ex.yaml
│   │   ├── Location/                # location-single-ex.yaml
│   │   ├── HealthcareService/       # consultation.yaml, follow-up.yaml
│   │   ├── Questionnaire/           # 10 questionnaire YAML files
│   │   ├── Mapping/                 # 10 SDC mapping YAML files
│   │   ├── Client/                  # web.yaml, sdc-ide.yaml
│   │   ├── Role/                    # admin.yaml
│   │   ├── AccessPolicy/            # admin-policy.yaml
│   │   ├── AidboxQuery/             # Provenance queries
│   │   └── SDCConfig/               # beda-forms.yaml
│   ├── ig0/CodeSystem/              # PH Core code systems
│   ├── ig1/ValueSet/                # PH Core value sets
│   └── init-bundles/                # Generated (gitignored)
│
├── src/
│   ├── main.tsx                     # Entry point: providers, routes, menu, auth
│   ├── vite-env.d.ts                # Vite client types
│   ├── components/
│   │   └── index.ts                 # Empty (placeholder for custom components)
│   ├── containers/
│   │   ├── index.ts                 # Re-exports (empty)
│   │   ├── Analytics/
│   │   │   ├── index.tsx            # Pie chart dashboard
│   │   │   ├── hooks.ts             # SQL queries (useAnalytics, useActiveDataDetails)
│   │   │   ├── constants.ts         # Gender options, color palette
│   │   │   └── Analytics.styles.ts  # Styled components
│   │   ├── EncountersUberList/
│   │   │   └── index.tsx            # ResourceListPage<Encounter>
│   │   ├── ImmunizationsUberList /
│   │   │   └── index.tsx            # ResourceListPage<Immunization>
│   │   ├── MedicationsUberList/
│   │   │   └── index.tsx            # ResourceListPage<Medication>
│   │   ├── ObservationsUberList/
│   │   │   └── index.tsx            # ResourceListPage<Observation>
│   │   ├── OrganizationsUberList/
│   │   │   └── index.tsx            # ResourceListPage<Organization>
│   │   ├── PatientsUberList/
│   │   │   ├── index.tsx            # ResourceListPage<Patient>
│   │   │   ├── detail.tsx           # Patient detail (Overview, Documents, Apps)
│   │   │   ├── dashboard.tsx        # 5-card dashboard
│   │   │   └── utils.ts             # IPS Bundle prep, search params
│   │   ├── PractitionerRolesUberList/
│   │   │   └── index.tsx            # ResourceListPage<PractitionerRole>
│   │   ├── PractitionersUberList /
│   │   │   └── index.tsx            # ResourceListPage<Practitioner>
│   │   ├── ProceduresUberList/
│   │   │   └── index.tsx            # ResourceListPage<Procedure>
│   │   ├── Questionnaire/
│   │   │   └── list.tsx             # ResourceListPage<Questionnaire>
│   │   └── SignIn/
│   │       ├── index.tsx            # OAuth login page
│   │       └── SignIn.styles.ts     # Custom header styles
│   ├── locale/
│   │   └── en/messages.po           # English UI strings
│   ├── services/
│   │   └── i18n.ts                  # Lingui setup
│   └── stories/                     # Default Storybook stories
│
├── tsconfig.json                    # TS strict, ES2020, ESNext modules
├── tsconfig.node.json               # TS for Vite/Node
├── vite.config.ts                   # Vite: React + styled-components Babel plugin
└── yarn.lock
```

---

## 17. Appendix: Change Log

| Date | Change | Description |
|---|---|---|
| 2026-06-25 | Initial OpenSpec | Created this document |

---

*This document is an OpenSpec specification. It describes the project in natural language for both human readers and AI assistants. When implementing changes, reference the relevant sections to understand the architecture and patterns.*
