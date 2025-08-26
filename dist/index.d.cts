import { QueryResult, CompilableQuery, TableV2Options, Schema, SchemaTableType, Table, BaseColumnType } from '@powersync/common';
import { Query, Relations, Casing, InferSelectModel } from 'drizzle-orm';
import { ExtractTablesWithRelations } from 'drizzle-orm/relations';
import { SQLiteTransaction, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { DrizzleConfig } from 'drizzle-orm/utils';
import { SQLiteTransactionConfig } from 'drizzle-orm/sqlite-core/session';
import { DB } from '@op-engineering/op-sqlite';
import { CasingCache } from 'drizzle-orm/casing';

type PowerSyncSQLiteTransactionConfig = SQLiteTransactionConfig & {
    accessMode?: 'read only' | 'read write';
};

type DrizzleQuery<T> = {
    toSQL(): Query;
    execute(): Promise<T | T[]>;
};
declare class PowerSyncSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends BaseSQLiteDatabase<'sync', QueryResult, TSchema> {
    private db;
    constructor(db: DB, config?: DrizzleConfig<TSchema>);
    transaction<T>(transaction: (tx: SQLiteTransaction<'sync', QueryResult, TSchema, ExtractTablesWithRelations<TSchema>>) => T, config?: PowerSyncSQLiteTransactionConfig): T;
}
declare function wrapPowerSyncWithDrizzle<TSchema extends Record<string, unknown> = Record<string, never>>(db: DB, config?: DrizzleConfig<TSchema>): PowerSyncSQLiteDatabase<TSchema>;

/**
 * Converts a Drizzle query into a `CompilableQuery` compatible with PowerSync hooks.
 * It allows you to seamlessly integrate Drizzle queries with PowerSync for
 * reactive data fetching and real-time updates.
 *
 * @example
 * import { toCompilableQuery } from '@powersync/drizzle-driver';
 *
 * const query = db.select().from(lists);
 * const { data: listRecords, isLoading } = useQuery(toCompilableQuery(query));
 *
 * return (
 *   <View>
 *     {listRecords.map((l) => (
 *       <Text key={l.id}>{JSON.stringify(l)}</Text>
 *     ))}
 *   </View>
 * );
 */
declare function toCompilableQuery<T>(query: {
    execute: () => T | T[];
    toSQL: () => Query;
}): CompilableQuery<T>;

type ExtractPowerSyncColumns<T extends SQLiteTableWithColumns<any>> = {
    [K in keyof InferSelectModel<T> as K extends 'id' ? never : K]: BaseColumnType<InferSelectModel<T>[K]>;
};
type Expand<T> = T extends infer O ? {
    [K in keyof O]: O[K];
} : never;
declare function toPowerSyncTable<T extends SQLiteTableWithColumns<any>>(table: T, options?: Omit<TableV2Options, 'indexes'> & {
    casingCache?: CasingCache;
}): Table<Expand<ExtractPowerSyncColumns<T>>>;
type DrizzleTablePowerSyncOptions = Omit<TableV2Options, 'indexes'>;
type DrizzleTableWithPowerSyncOptions = {
    tableDefinition: SQLiteTableWithColumns<any>;
    options?: DrizzleTablePowerSyncOptions;
};
type TableName<T> = T extends SQLiteTableWithColumns<any> ? T['_']['name'] : T extends DrizzleTableWithPowerSyncOptions ? T['tableDefinition']['_']['name'] : never;
type TablesFromSchemaEntries<T> = {
    [K in keyof T as T[K] extends Relations ? never : T[K] extends SQLiteTableWithColumns<any> | DrizzleTableWithPowerSyncOptions ? TableName<T[K]> : never]: T[K] extends SQLiteTableWithColumns<any> ? Table<Expand<ExtractPowerSyncColumns<T[K]>>> : T[K] extends DrizzleTableWithPowerSyncOptions ? Table<Expand<ExtractPowerSyncColumns<T[K]['tableDefinition']>>> : never;
};
type DrizzleAppSchemaOptions = {
    casing?: Casing;
};
declare class DrizzleAppSchema<T extends Record<string, SQLiteTableWithColumns<any> | Relations | DrizzleTableWithPowerSyncOptions>> extends Schema {
    constructor(drizzleSchema: T, options?: DrizzleAppSchemaOptions);
    readonly types: SchemaTableType<Expand<TablesFromSchemaEntries<T>>>;
}

export { DrizzleAppSchema, PowerSyncSQLiteDatabase, toCompilableQuery, toPowerSyncTable, wrapPowerSyncWithDrizzle };
export type { DrizzleAppSchemaOptions, DrizzleQuery, DrizzleTablePowerSyncOptions, DrizzleTableWithPowerSyncOptions, Expand, ExtractPowerSyncColumns, TableName, TablesFromSchemaEntries };
