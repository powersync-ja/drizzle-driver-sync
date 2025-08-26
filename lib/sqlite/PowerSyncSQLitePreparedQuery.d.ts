import { DB, QueryResult } from '@op-engineering/op-sqlite';
import { entityKind } from 'drizzle-orm/entity';
import type { Logger } from 'drizzle-orm/logger';
import { type Query } from 'drizzle-orm/sql/sql';
import type { SelectedFieldsOrdered } from 'drizzle-orm/sqlite-core/query-builders/select.types';
import { ExecuteResultSync, type PreparedQueryConfig as PreparedQueryConfigBase, type SQLiteExecuteMethod, SQLitePreparedQuery } from 'drizzle-orm/sqlite-core/session';
type PreparedQueryConfig = Omit<PreparedQueryConfigBase, 'statement' | 'run'>;
export declare class PowerSyncSQLitePreparedQuery<T extends PreparedQueryConfig = PreparedQueryConfig> extends SQLitePreparedQuery<{
    type: 'sync';
    run: QueryResult;
    all: T['all'];
    get: T['get'];
    values: T['values'];
    execute: T['execute'];
}> {
    private db;
    private logger;
    private fields;
    private _isResponseInArrayMode;
    private customResultMapper?;
    static readonly [entityKind]: string;
    constructor(db: DB, query: Query, logger: Logger, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, _isResponseInArrayMode: boolean, customResultMapper?: ((rows: unknown[][]) => unknown) | undefined);
    execute(placeholderValues?: Record<string, unknown>): ExecuteResultSync<T['execute']>;
    run(placeholderValues?: Record<string, unknown>): QueryResult;
    all(placeholderValues?: Record<string, unknown>): T['all'];
    get(placeholderValues?: Record<string, unknown>): T['get'];
    values(placeholderValues?: Record<string, unknown>): T['values'];
    isResponseInArrayMode(): boolean;
}
/**
 * Maps a database row object to a result object based on the provided column definitions.
 * It reconstructs the hierarchical structure of the result by following the specified paths for each field.
 * It also handles nullification of nested objects when joined tables are nullable.
 */
export declare function mapResultRow<TResult>(columns: SelectedFieldsOrdered, row: unknown[], joinsNotNullableMap: Record<string, boolean> | undefined): TResult;
export {};
