# 🏢 Property Monitoring Dashboard

A system for monitoring property inspection activity from LAHD, designed to help property managers quickly identify new, important, and urgent cases across company-owned properties.

---

## 🎯 Business Goal

Property managers need to:

* Detect new inspections or case activity as soon as possible
* Understand the current status of each case at a glance
* Identify urgent or high-risk cases quickly
* Make fast, informed decisions with minimal noise

This system focuses on surfacing the **right information, at the right time**, without overwhelming the user.

---

## 🧠 Solution Overview

The system provides a focused monitoring dashboard for inspection activity across selected properties.

* Users select which properties (APNs) to track
* Data is synchronized daily from the LAHD website
* Manual sync is available through the UI
* Cases are enriched with computed flags to highlight their importance

The dashboard enables users to immediately understand:

* What’s new
* What requires attention
* What is urgent

---

## 🏗 Architecture

### Server

**Tech:** Express + TypeScript + SQLite

Responsibilities:

* Scraping LAHD property and case data
* Extracting case activity and latest status
* Normalizing and storing data
* Computing flags (Open, Attention, Urgent, New)
* Exposing APIs for properties, sync, and monitoring

---

### Client

**Tech:** React + Vite

Responsibilities:

* Managing tracked properties
* Displaying a cases dashboard
* Filtering and searching cases
* Highlighting important cases using visual flags
* Triggering manual sync operations
* Showing sync progress

---

## 🗂 Data Model

This section lists the fields stored and **why they matter** for the dashboard use case.

### `properties`

| Field         | Description                                      |
| ------------- | ------------------------------------------------ |
| `id`          | Internal primary key                             |
| `apn`         | Unique property identifier (used for tracking)   |
| `description` | User-defined label (address, name, etc.)         |
| `created_at`  | Record creation timestamp (mainly for debugging) |

---

### `cases`

| Field                  | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `id`                   | Primary key                                                  |
| `property_id`          | Reference to the related property                            |
| `case_number`          | Case identifier                                              |
| `case_type`            | Case classification label from LAHD                          |
| `case_type_id`         | Case classification identifier from LAHD                     |
| `latest_status`        | Most recent known status                                     |
| `latest_activity_date` | Timestamp of last activity                                   |
| `has_new_activity`     | Stored marker used by monitoring logic to flag recent change |

### `sync_runs`

Mainly used for sync monitoring and debugging.

**Why these fields:**
- `properties.apn` is the external identifier used by LAHD and is required for scraping.
- `properties.description` helps humans recognize the property quickly in the UI.
- `properties.created_at` is only for traceability/debugging.
- `cases.case_number` + `case_type_id` uniquely identify a case for syncing activities.
- `cases.case_type` and `latest_status` power the flags and quick “at‑a‑glance” status.
- `cases.latest_activity_date` enables “what’s new” and sorting by recency.
- `cases.has_new_activity` preserves a recent-activity signal between sync cycles.
- `sync_runs` fields track execution state, progress, errors, and per-run outcomes for observability.

These fields allow the system to determine:

* Case state
* Recency of activity
* Priority level for display

---

## 🚩 Flags Logic

Flags are computed on the server to ensure consistent behavior across the UI:

* **isOpen**
  Case is considered open unless marked as closed or resolved

* **needsAttention**
  Triggered for cases such as:

  * violations
  * non-compliance
  * follow-ups
  * re-inspections

* **isUrgent**
  Triggered for high-risk situations such as:

  * order to comply
  * final notice
  * hazardous conditions

* **hasNewActivity**

  * Activity occurred after the last sync
  * OR within the last 100 days

These flags allow the dashboard to prioritize cases effectively.

---

### ⚠️ Important Note on Flag Logic

**The classification and flag logic is example code only.**

The flags (Open, Needs Attention, Urgent, New Activity) are computed using simplified heuristics based on case status keywords. This logic is:

* **Intentionally simple** for demonstration purposes
* **Easy to customize** on the server side
* **Not production-tested** against real LAHD data patterns

**To adapt for your use case:**

1. Review the flag logic in [`server/src/services/cases/case-labels.service.ts`](server/src/services/cases/case-labels.service.ts)
2. Adjust the status markers in [`server/src/services/cases/case-classifiers.ts`](server/src/services/cases/case-classifiers.ts)
3. Add real case data and test the output
4. Refine keywords and classification rules as needed

This design allows quick iteration without changing the rest of the system.

---

## ▲ Case Priority Scoring

In addition to the flags, the server sorts cases by a simple priority score so the most important items appear first.

The score is computed as:

```
score = (isUrgent ? 8 : 0)
      + (needsAttention ? 4 : 0)
      + (hasNewActivity ? 2 : 0)
      + (isOpen ? 1 : 0)
```

Cases are ordered by:

1. Highest score first
2. Most recent `latest_activity_date` if scores are equal

This is intentionally simple and easy to adjust in
`server/src/services/monitoring/overview.service.ts` and the flag rules in
`server/src/services/cases/case-classifiers.ts`.

---

## 🔄 Data Synchronization

The system retrieves data in two stages:

1. Property case lists (by APN)
2. Individual case activity pages (for latest status and timestamps)

Features:

* Retry mechanism
* Timeout handling
* Exponential backoff

Sync runs:

* Automatically once per day
* Manually via the UI

---

## 🌐 API Overview

| Endpoint                                | Description                      |
| --------------------------------------- | -------------------------------- |
| `GET /api/properties`                   | List tracked properties          |
| `POST /api/properties`                  | Add or update a property         |
| `POST /api/monitoring/sync-all`         | Sync all properties              |
| `POST /api/monitoring/:apn/sync`        | Sync a single property           |
| `GET /api/monitoring/sync-all/progress` | Get sync progress                |
| `GET /api/monitoring/cases/overview`    | Get cases with flags and summary |

---

## 🖥 Dashboard Capabilities

* Case table with:

  * Case number (link to source)
  * Type
  * Latest status
  * Latest activity date
  * Visual flags (Open / Attention / Urgent / New)

* Summary cards:

  * Total cases
  * Open cases
  * Needs attention
  * Urgent

* Filters:

  * Search (APN, case number, status, etc.)
  * Open only
  * Needs attention
  * Urgent

* Sync progress view:

  * Property-level progress
  * Case-level progress
  * Success / failure metrics

---

## 🚀 Running Instructions

###  Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

Then open your browser to:

* **Management Properties**: http://localhost:5173/properties
* **Dashboard**: http://localhost:5173

The system DB initializes automatically with the default property (APN: 2654002037).

(The server API is accessible via proxy at `/api` - no direct port exposure)

### Option 2: Manual Setup (Development)

**Server:**
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:3000
```

**Client (new terminal):**
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

**Run Server Tests:**
```bash
cd server
npm test
```

### Environment Variables

The system uses sensible defaults, but you can customize via `.env` or `docker-compose.yml`:

* `PORT` – Server port (default: 3000)
* `SCRAPE_TIMEOUT_MS` – Timeout for LAHD scraping (default: 30000 = 30 seconds)
* `SCRAPE_RETRY_ATTEMPTS` – Retry attempts on timeout (default: 4)
* `SCRAPE_RETRY_BASE_DELAY_MS` – Delay between retries (default: 2000 = 2 seconds, exponential backoff)
* `DAILY_SYNC_CRON` – Cron schedule for daily sync (default: "0 2 * * *" – 2 AM UTC)
* `DAILY_SYNC_TIMEZONE` – Timezone for cron (default: "Asia/Jerusalem")
* `LOG_LEVEL` – Logging level (default: "info", options: "debug", "info", "warn", "error")

---

## 🚀 Future Improvements

If given more time, I would extend the system with:

* Automated tests (unit + integration)
* Smarter sync policies

  * e.g. closed cases updated less frequently
* Database optimizations

  * batching
  * indexing
* Data retention / cleanup strategy
* User-controlled flag overrides
* Multi-user support
* Subscriptions / notifications (alerts on urgent cases)
