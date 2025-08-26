import { entityKind } from 'drizzle-orm/entity';
import type { RelationalSchemaConfig, TablesRelationalConfig } from 'drizzle-orm/relations';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import { PowerSyncSQLiteBaseSession, PowerSyncSQLiteSessionOptions, PowerSyncSQLiteTransaction, PowerSyncSQLiteTransactionConfig } from './PowerSyncSQLiteBaseSession.js';
import { DB, Transaction } from '@op-engineering/op-sqlite';
export declare class PowerSyncSQLiteSession<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends PowerSyncSQLiteBaseSession<TFullSchema, TSchema> {
    static readonly [entityKind]: string;
    protected client: DB;
    constructor(db: DB, dialect: SQLiteSyncDialect, schema: RelationalSchemaConfig<TSchema> | undefined, options?: PowerSyncSQLiteSessionOptions);
    transaction<T>(transaction: (tx: PowerSyncSQLiteTransaction<TFullSchema, TSchema>) => T, config?: PowerSyncSQLiteTransactionConfig): T;
    protected internalTransaction<T>(transaction: Transaction, fn: (tx: PowerSyncSQLiteTransaction<TFullSchema, TSchema>) => T, config?: PowerSyncSQLiteTransactionConfig): T;
}
