import { Query } from 'drizzle-orm';
import { ExtractTablesWithRelations } from 'drizzle-orm/relations';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import type { DrizzleConfig } from 'drizzle-orm/utils';
import { PowerSyncSQLiteTransactionConfig } from './PowerSyncSQLiteBaseSession.js';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
export type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
export declare class PowerSyncSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema> {
    private db;
    constructor(db: DB, config?: DrizzleConfig<TSchema>);
    transaction<T>(transaction: (tx: SQLiteTransaction<'sync', QueryResult, TSchema, ExtractTablesWithRelations<TSchema>>) => T, config?: PowerSyncSQLiteTransactionConfig): T;
}
export declare function wrapPowerSyncWithDrizzle<TSchema extends Record<string, unknown> = Record<string, never>>(db: DB, config?: DrizzleConfig<TSchema>): PowerSyncSQLiteDatabase<TSchema>;
