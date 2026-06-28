import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "taskflow_offline.db";
const DATABASE_VERSION = 1;

let dbPromise = null;

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks_local (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',

  due_at TEXT,
  reminder_at TEXT,
  completed_at TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,

  metadata TEXT NOT NULL DEFAULT '{}',

  sync_version INTEGER NOT NULL DEFAULT 1,
  last_synced_at TEXT,
  last_modified_by TEXT,

  deleted_at TEXT,
  archived_at TEXT,

  sync_status TEXT NOT NULL DEFAULT 'synced',
  is_dirty INTEGER NOT NULL DEFAULT 0,
  local_updated_at TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_local_user_id_idx
  ON tasks_local(user_id);

CREATE INDEX IF NOT EXISTS tasks_local_sync_status_idx
  ON tasks_local(sync_status);

CREATE INDEX IF NOT EXISTS tasks_local_updated_at_idx
  ON tasks_local(updated_at);

CREATE INDEX IF NOT EXISTS tasks_local_deleted_at_idx
  ON tasks_local(deleted_at);

CREATE INDEX IF NOT EXISTS tasks_local_sort_order_idx
  ON tasks_local(user_id, sort_order);

CREATE TABLE IF NOT EXISTS pending_operations (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,

  operation TEXT NOT NULL
    CHECK (operation IN ('create', 'update', 'delete', 'restore', 'bulk_sync')),

  payload_json TEXT NOT NULL DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'syncing', 'failed')),

  attempts INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  error_message TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_attempt_at TEXT,
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS pending_operations_status_idx
  ON pending_operations(status);

CREATE INDEX IF NOT EXISTS pending_operations_user_id_idx
  ON pending_operations(user_id);

CREATE INDEX IF NOT EXISTS pending_operations_task_id_idx
  ON pending_operations(task_id);

CREATE INDEX IF NOT EXISTS pending_operations_created_at_idx
  ON pending_operations(created_at);

CREATE TABLE IF NOT EXISTS sync_meta (
  user_id TEXT PRIMARY KEY NOT NULL,
  device_id TEXT NOT NULL,
  last_successful_sync_at TEXT,
  last_pulled_at TEXT,
  last_pushed_at TEXT,
  updated_at TEXT NOT NULL
);
`;

async function createOrMigrateSchema(db) {
	const versionRow = await db.getFirstAsync("PRAGMA user_version");
	const currentVersion = versionRow?.user_version ?? 0;

	if (currentVersion >= DATABASE_VERSION) {
		return;
	}

	await db.execAsync(`
    PRAGMA journal_mode = WAL;
    ${SCHEMA_SQL}
    PRAGMA user_version = ${DATABASE_VERSION};
  `);
}

async function initializeDb() {
	const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

	await db.execAsync("PRAGMA journal_mode = WAL;");
	await db.execAsync("PRAGMA foreign_keys = ON;");

	await createOrMigrateSchema(db);

	return db;
}

export async function getOfflineDb() {
	if (!dbPromise) {
		dbPromise = initializeDb();
	}

	return dbPromise;
}

export async function truncateLocalDb() {
	const db = await getOfflineDb();

	await db.withTransactionAsync(async () => {
		await db.execAsync(`
      DELETE FROM pending_operations;
      DELETE FROM sync_meta;
      DELETE FROM tasks_local;
    `);
	});
}

export async function resetOfflineDb() {
	const db = await getOfflineDb();

	await db.execAsync(`
    DROP TABLE IF EXISTS pending_operations;
    DROP TABLE IF EXISTS sync_meta;
    DROP TABLE IF EXISTS tasks_local;
    PRAGMA user_version = 0;
  `);

	dbPromise = null;
}

export const OFFLINE_DB_NAME = DATABASE_NAME;
export const OFFLINE_DB_VERSION = DATABASE_VERSION;
