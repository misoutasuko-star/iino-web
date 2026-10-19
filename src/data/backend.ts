import type { SupabaseClient } from '@supabase/supabase-js'
import { TABLES, type TableName, type Tables } from '../lib/types'

// Two ways to store data:
// - SupabaseBackend: the shared cloud tables, same as the iPhone app.
// - LocalBackend: this browser only, for "Continue without an account".
//
// Rules from the spec (05 §5.4) that the Supabase writer follows:
// client-generated UUIDs, never send updated_at, never hard-delete (set deleted_at),
// and always read rows where deleted_at is null.

export interface Backend {
  load(): Promise<Tables>
  upsert<T extends TableName>(table: T, rows: Tables[T]): Promise<void>
  softDelete(table: TableName, ids: string[]): Promise<void>
  /** Calls back when another device changes data. Returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void
}

export const emptyTables = (): Tables => ({
  tasks: [],
  task_logs: [],
  habits: [],
  habit_logs: [],
  exams: [],
  work_windows: [],
})

const PAGE = 1000

export class SupabaseBackend implements Backend {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}

  async load(): Promise<Tables> {
    const result = emptyTables()
    await Promise.all(
      TABLES.map(async (table) => {
        const rows: unknown[] = []
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await this.client
            .from(table)
            .select('*')
            .is('deleted_at', null)
            .order('id')
            .range(from, from + PAGE - 1)
          if (error) throw error
          rows.push(...(data ?? []))
          if (!data || data.length < PAGE) break
        }
        ;(result[table] as unknown[]) = rows.map(clean)
      }),
    )
    return result
  }

  async upsert<T extends TableName>(table: T, rows: Tables[T]): Promise<void> {
    if (rows.length === 0) return
    const payload = rows.map((r) => ({ ...clean(r), user_id: this.userId }))
    const { error } = await this.client.from(table).upsert(payload, { onConflict: 'id' })
    if (error) throw error
  }

  async softDelete(table: TableName, ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await this.client.from(table).update({ deleted_at: new Date().toISOString() }).in('id', ids)
    if (error) throw error
  }

  subscribe(onChange: () => void): () => void {
    // Works once Realtime is switched on for these tables in Supabase; harmless otherwise.
    const channel = this.client.channel(`iino-${this.userId}`)
    for (const table of TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${this.userId}` }, onChange)
    }
    channel.subscribe()
    return () => {
      this.client.removeChannel(channel)
    }
  }
}

/** Drops sync metadata the client must never send (and doesn't need to keep). */
function clean<T>(row: T): T {
  const { updated_at: _u, deleted_at: _d, logs: _l, ...rest } = row as Record<string, unknown>
  return rest as T
}

const LOCAL_KEY = 'iino.local.v1'

export class LocalBackend implements Backend {
  private read(): Tables {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw ? { ...emptyTables(), ...JSON.parse(raw) } : emptyTables()
    } catch {
      return emptyTables()
    }
  }

  private write(tables: Tables) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(tables))
    } catch {
      // Storage full or blocked: data stays in memory for this visit.
    }
  }

  async load(): Promise<Tables> {
    return this.read()
  }

  async upsert<T extends TableName>(table: T, rows: Tables[T]): Promise<void> {
    const tables = this.read()
    const byId = new Map((tables[table] as { id: string }[]).map((r) => [r.id, r]))
    for (const r of rows as { id: string }[]) byId.set(r.id, clean(r))
    ;(tables[table] as unknown[]) = [...byId.values()]
    this.write(tables)
  }

  async softDelete(table: TableName, ids: string[]): Promise<void> {
    const tables = this.read()
    const removed = new Set(ids)
    ;(tables[table] as { id: string }[]) = (tables[table] as { id: string }[]).filter((r) => !removed.has(r.id))
    this.write(tables)
  }

  subscribe(onChange: () => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }
}
