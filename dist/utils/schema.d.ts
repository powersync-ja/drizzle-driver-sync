import { Schema, SchemaTableType, Table, type BaseColumnType, type TableV2Options } from '@powersync/common';
import { InferSelectModel, Relations, type Casing } from 'drizzle-orm';
import { CasingCache } from 'drizzle-orm/casing';
import { type SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
export type ExtractPowerSyncColumns<T extends SQLiteTableWithColumns<any>> = {
    [K in keyof InferSelectModel<T> as K extends 'id' ? never : K]: BaseColumnType<InferSelectModel<T>[K]>;
};
export type Expand<T> = T extends infer O ? {
    [K in keyof O]: O[K];
} : never;
export declare function toPowerSyncTable<T extends SQLiteTableWithColumns<any>>(table: T, options?: Omit<TableV2Options, 'indexes'> & {
    casingCache?: CasingCache;
}): Table<Expand<ExtractPowerSyncColumns<T>>>;
export type DrizzleTablePowerSyncOptions = Omit<TableV2Options, 'indexes'>;
export type DrizzleTableWithPowerSyncOptions = {
    tableDefinition: SQLiteTableWithColumns<any>;
    options?: DrizzleTablePowerSyncOptions;
};
export type TableName<T> = T extends SQLiteTableWithColumns<any> ? T['_']['name'] : T extends DrizzleTableWithPowerSyncOptions ? T['tableDefinition']['_']['name'] : never;
export type TablesFromSchemaEntries<T> = {
    [K in keyof T as T[K] extends Relations ? never : T[K] extends SQLiteTableWithColumns<any> | DrizzleTableWithPowerSyncOptions ? TableName<T[K]> : never]: T[K] extends SQLiteTableWithColumns<any> ? Table<Expand<ExtractPowerSyncColumns<T[K]>>> : T[K] extends DrizzleTableWithPowerSyncOptions ? Table<Expand<ExtractPowerSyncColumns<T[K]['tableDefinition']>>> : never;
};
export type DrizzleAppSchemaOptions = {
    casing?: Casing;
};
export declare class DrizzleAppSchema<T extends Record<string, SQLiteTableWithColumns<any> | Relations | DrizzleTableWithPowerSyncOptions>> extends Schema {
    constructor(drizzleSchema: T, options?: DrizzleAppSchemaOptions);
    readonly types: SchemaTableType<Expand<TablesFromSchemaEntries<T>>>;
}
