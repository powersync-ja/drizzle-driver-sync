import { column, Schema, Table } from '@powersync/common';
import { entityKind, isTable } from 'drizzle-orm';
import { CasingCache } from 'drizzle-orm/casing';
import { getTableConfig, SQLiteBoolean, SQLiteCustomColumn, SQLiteInteger, SQLiteReal, SQLiteText, SQLiteTextJson, SQLiteTimestamp } from 'drizzle-orm/sqlite-core';
export function toPowerSyncTable(table, options) {
    var _a, _b;
    const { columns: drizzleColumns, indexes: drizzleIndexes } = getTableConfig(table);
    const { casingCache } = options !== null && options !== void 0 ? options : {};
    const columns = {};
    for (const drizzleColumn of drizzleColumns) {
        const name = (_a = casingCache === null || casingCache === void 0 ? void 0 : casingCache.getColumnCasing(drizzleColumn)) !== null && _a !== void 0 ? _a : drizzleColumn.name;
        // Skip the id column
        if (name === 'id') {
            continue;
        }
        columns[name] = mapDrizzleColumnToType(drizzleColumn);
    }
    const indexes = {};
    for (const index of drizzleIndexes) {
        index.config;
        if (!index.config.columns.length) {
            continue;
        }
        const columns = [];
        for (const indexColumn of index.config.columns) {
            const name = (_b = casingCache === null || casingCache === void 0 ? void 0 : casingCache.getColumnCasing(indexColumn)) !== null && _b !== void 0 ? _b : indexColumn.name;
            columns.push(name);
        }
        indexes[index.config.name] = columns;
    }
    return new Table(columns, Object.assign(Object.assign({}, options), { indexes }));
}
function mapDrizzleColumnToType(drizzleColumn) {
    switch (drizzleColumn.columnType) {
        case SQLiteText[entityKind]:
        case SQLiteTextJson[entityKind]:
            return column.text;
        case SQLiteInteger[entityKind]:
        case SQLiteTimestamp[entityKind]:
        case SQLiteBoolean[entityKind]:
            return column.integer;
        case SQLiteReal[entityKind]:
            return column.real;
        case SQLiteCustomColumn[entityKind]:
            const sqlName = drizzleColumn.getSQLType();
            switch (sqlName) {
                case 'text':
                    return column.text;
                case 'integer':
                    return column.integer;
                case 'real':
                    return column.real;
                default:
                    throw new Error(`Unsupported custom column type: ${drizzleColumn.columnType}: ${sqlName}`);
            }
        default:
            throw new Error(`Unsupported column type: ${drizzleColumn.columnType}`);
    }
}
function toPowerSyncTables(schemaEntries, options) {
    const casingCache = (options === null || options === void 0 ? void 0 : options.casing) ? new CasingCache(options === null || options === void 0 ? void 0 : options.casing) : undefined;
    const tables = {};
    for (const schemaEntry of Object.values(schemaEntries)) {
        let maybeTable = undefined;
        let maybeOptions = undefined;
        if (typeof schemaEntry === 'object' && 'tableDefinition' in schemaEntry) {
            const tableWithOptions = schemaEntry;
            maybeTable = tableWithOptions.tableDefinition;
            maybeOptions = tableWithOptions.options;
        }
        else {
            maybeTable = schemaEntry;
        }
        if (isTable(maybeTable)) {
            const { name } = getTableConfig(maybeTable);
            tables[name] = toPowerSyncTable(maybeTable, Object.assign(Object.assign({}, maybeOptions), { casingCache }));
        }
    }
    return tables;
}
export class DrizzleAppSchema extends Schema {
    constructor(drizzleSchema, options) {
        super(toPowerSyncTables(drizzleSchema, options));
        // This is just used for typing
        this.types = {};
    }
}
//# sourceMappingURL=schema.js.map