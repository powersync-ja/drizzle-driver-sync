import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import type { RelationalSchemaConfig, TablesRelationalConfig } from 'drizzle-orm/relations';
import { type Query } from 'drizzle-orm/sql/sql';
import type { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import type { SelectedFieldsOrdered } from 'drizzle-orm/sqlite-core/query-builders/select.types';
import { type PreparedQueryConfig as PreparedQueryConfigBase, type SQLiteExecuteMethod, SQLiteSession, SQLiteTransaction, type SQLiteTransactionConfig } from 'drizzle-orm/sqlite-core/session';
import { PowerSyncSQLitePreparedQuery } from './PowerSyncSQLitePreparedQuery.js';
import { DB, QueryResult } from '@op-engineering/op-sqlite';
export interface PowerSyncSQLiteSessionOptions {
    logger?: Logger;
}
export type PowerSyncSQLiteTransactionConfig = SQLiteTransactionConfig & {
    accessMode?: 'read only' | 'read write';
};
export declare class PowerSyncSQLiteTransaction<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends SQLiteTransaction<'sync', QueryResult, TFullSchema, TSchema> {
    static readonly [entityKind]: string;
}
export declare class PowerSyncSQLiteBaseSession<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends SQLiteSession<'sync', QueryResult, TFullSchema, TSchema> {
    protected db: DB;
    protected dialect: SQLiteSyncDialect;
    protected schema: RelationalSchemaConfig<TSchema> | undefined;
    protected options: PowerSyncSQLiteSessionOptions;
    static readonly [entityKind]: string;
    protected logger: Logger;
    constructor(db: DB, dialect: SQLiteSyncDialect, schema: RelationalSchemaConfig<TSchema> | undefined, options?: PowerSyncSQLiteSessionOptions);
    prepareQuery<T extends PreparedQueryConfigBase & {
        type: 'sync';
    }>(query: Query, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, isResponseInArrayMode: boolean, customResultMapper?: (rows: unknown[][], mapColumnValue?: (value: unknown) => unknown) => unknown): PowerSyncSQLitePreparedQuery<T>;
    transaction<T>(_transaction: (tx: PowerSyncSQLiteTransaction<TFullSchema, TSchema>) => T, _config?: PowerSyncSQLiteTransactionConfig): T;
}
