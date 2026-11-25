import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface D1PreparedStatementShim {
  bind(...values: unknown[]): D1PreparedStatementShim;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{
    results: T[];
    success: boolean;
    meta: { changes: number; last_row_id?: number };
  }>;
  all<T = Record<string, unknown>>(): Promise<{
    success: boolean;
    results: T[];
    meta: { changes: number; last_row_id?: number };
  }>;
}

export interface D1DatabaseShim {
  prepare(query: string): D1PreparedStatementShim;
  batch<T = unknown>(
    statements: D1PreparedStatementShim[]
  ): Promise<
    { success: boolean; results: T[]; meta: { changes: number; last_row_id?: number } }[]
  >;
  rawDb: DatabaseSync;
  close(): void;
}

function normalizeSqlValue(v: unknown): null | number | bigint | string | Uint8Array {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'string') return v;
  if (v instanceof Uint8Array) return v;
  return String(v);
}

interface InternalStatement extends D1PreparedStatementShim {
  _sql: string;
  _params: Array<null | number | bigint | string | Uint8Array>;
  _exec(): { changes: number; last_row_id: number; results?: unknown[] };
}

export function createSqliteD1Database(migrationsDir: string): D1DatabaseShim {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    sqlite.exec(sql);
  }

  const prepare = (query: string): InternalStatement => {
    let boundParams: Array<null | number | bigint | string | Uint8Array> = [];

    const stmtObj: InternalStatement = {
      _sql: query,
      get _params() {
        return boundParams;
      },
      bind(...values: unknown[]) {
        boundParams = values.map(normalizeSqlValue);
        return stmtObj;
      },
      _exec() {
        const prepared = sqlite.prepare(query);
        if (/\bRETURNING\b/i.test(query)) {
          const rows = prepared.all(...boundParams);
          return { changes: rows.length, last_row_id: 0, results: rows };
        }
        const res = prepared.run(...boundParams);
        return {
          changes: Number(res.changes ?? 0),
          last_row_id: Number(res.lastInsertRowid ?? 0),
        };
      },
      async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
        const prepared = sqlite.prepare(query);
        const row = prepared.get(...boundParams) as Record<string, unknown> | undefined;
        if (!row) return null;
        if (colName) {
          return (row[colName] as T) ?? null;
        }
        return row as T;
      },
      async run<T = Record<string, unknown>>() {
        const res = stmtObj._exec();
        return {
          results: (res.results as T[]) || [],
          success: true,
          meta: {
            changes: res.changes,
            last_row_id: res.last_row_id,
          },
        };
      },
      async all<T = Record<string, unknown>>() {
        const prepared = sqlite.prepare(query);
        const rows = prepared.all(...boundParams) as T[];
        return {
          success: true,
          results: rows,
          meta: { changes: 0 },
        };
      },
    };

    return stmtObj;
  };

  return {
    prepare,
    async batch<T = unknown>(statements: D1PreparedStatementShim[]) {
      const results: {
        success: boolean;
        results: T[];
        meta: { changes: number; last_row_id?: number };
      }[] = [];
      sqlite.exec('BEGIN IMMEDIATE;');
      try {
        for (const stmt of statements as InternalStatement[]) {
          const execRes = stmt._exec();
          results.push({
            success: true,
            results: (execRes.results as T[]) || [],
            meta: {
              changes: execRes.changes,
              last_row_id: execRes.last_row_id,
            },
          });
        }
        sqlite.exec('COMMIT;');
        return results;
      } catch (err) {
        try {
          sqlite.exec('ROLLBACK;');
        } catch {
          // Ignore rollback failure
        }
        throw err;
      }
    },
    rawDb: sqlite,
    close() {
      sqlite.close();
    },
  };
}
