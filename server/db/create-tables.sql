CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  apn TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  case_number TEXT NOT NULL,
  case_type TEXT,
  case_type_id TEXT NOT NULL,
  latest_status TEXT,
  latest_activity_date TEXT,
  UNIQUE(case_number, property_id, case_type_id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    total_properties INTEGER NOT NULL DEFAULT 0,
    processed_properties INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    successful_properties INTEGER NOT NULL DEFAULT 0,
    failed_properties INTEGER NOT NULL DEFAULT 0,
    total_saved_cases INTEGER NOT NULL DEFAULT 0,
    total_activity_sync_succeeded INTEGER NOT NULL DEFAULT 0,
    total_activity_sync_failed INTEGER NOT NULL DEFAULT 0,
    current_apn TEXT,
    current_description TEXT,
    current_case_number TEXT,
    processed_cases INTEGER NOT NULL DEFAULT 0,
    total_cases INTEGER NOT NULL DEFAULT 0,
    case_percentage INTEGER NOT NULL DEFAULT 0,
    errors_json TEXT NOT NULL DEFAULT '[]',
    results_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );