'use strict';

var logger = require('drizzle-orm/logger');
var relations = require('drizzle-orm/relations');
var db = require('drizzle-orm/sqlite-core/db');
var dialect = require('drizzle-orm/sqlite-core/dialect');
var entity = require('drizzle-orm/entity');
var session = require('drizzle-orm/sqlite-core/session');
var drizzleOrm = require('drizzle-orm');
var sql = require('drizzle-orm/sql/sql');
var common = require('@powersync/common');
var casing = require('drizzle-orm/casing');
var sqliteCore = require('drizzle-orm/sqlite-core');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var _a$2;
class PowerSyncSQLitePreparedQuery extends session.SQLitePreparedQuery {
    constructor(db, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        super('sync', executeMethod, query);
        this.db = db;
        this.logger = logger;
        this.fields = fields;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
    }
    execute(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeRawSync(this.query.sql, params);
        return new session.ExecuteResultSync(() => {
            return this.mapResult(rs, false);
        });
    }
    run(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeSync(this.query.sql, params);
        return rs;
    }
    all(placeholderValues) {
        var _b;
        const { fields, query, logger, customResultMapper } = this;
        if (!fields && !customResultMapper) {
            const params = sql.fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
            logger.logQuery(query.sql, params);
            const rs = this.db.executeSync(this.query.sql, params);
            return (_b = rs.rows) !== null && _b !== void 0 ? _b : [];
        }
        const rows = this.values(placeholderValues);
        // if (customResultMapper) {
        //   const mapped = customResultMapper(rows) as T['all'];
        //   return mapped;
        // }
        return rows.map((row) => mapResultRow(fields, row, this.joinsNotNullableMap));
    }
    get(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const { fields, customResultMapper } = this;
        const joinsNotNullableMap = this.joinsNotNullableMap;
        if (!fields && !customResultMapper) {
            return this.db.executeSync(this.query.sql, params);
        }
        const rows = this.values(placeholderValues);
        const row = rows[0];
        if (!row) {
            return undefined;
        }
        // if (customResultMapper) {
        //   return customResultMapper(rows) as T['get'];
        // }
        return mapResultRow(fields, row, joinsNotNullableMap);
    }
    values(placeholderValues) {
        const params = sql.fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        return this.db.executeRawSync(this.query.sql, params);
    }
    isResponseInArrayMode() {
        return this._isResponseInArrayMode;
    }
}
_a$2 = entity.entityKind;
PowerSyncSQLitePreparedQuery[_a$2] = 'PowerSyncSQLitePreparedQuery';
/**
 * Maps a database row object to a result object based on the provided column definitions.
 * It reconstructs the hierarchical structure of the result by following the specified paths for each field.
 * It also handles nullification of nested objects when joined tables are nullable.
 */
function mapResultRow(columns, row, joinsNotNullableMap) {
    // Key -> nested object key, value -> table name if all fields in the nested object are from the same table, false otherwise
    const nullifyMap = {};
    const result = columns.reduce((result, { path, field }, columnIndex) => {
        const decoder = getDecoder(field);
        let node = result;
        for (const [pathChunkIndex, pathChunk] of path.entries()) {
            if (pathChunkIndex < path.length - 1) {
                if (!(pathChunk in node)) {
                    node[pathChunk] = {};
                }
                node = node[pathChunk];
            }
            else {
                const rawValue = row[columnIndex];
                const value = (node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue));
                updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap);
            }
        }
        return result;
    }, {});
    applyNullifyMap(result, nullifyMap, joinsNotNullableMap);
    return result;
}
/**
 * Determines the appropriate decoder for a given field.
 */
function getDecoder(field) {
    if (entity.is(field, drizzleOrm.Column)) {
        return field;
    }
    else if (entity.is(field, drizzleOrm.SQL)) {
        return field.decoder;
    }
    else {
        return field.sql.decoder;
    }
}
function updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap) {
    if (!joinsNotNullableMap || !entity.is(field, drizzleOrm.Column) || path.length !== 2) {
        return;
    }
    const objectName = path[0];
    if (!(objectName in nullifyMap)) {
        nullifyMap[objectName] = value === null ? drizzleOrm.getTableName(field.table) : false;
    }
    else if (typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== drizzleOrm.getTableName(field.table)) {
        nullifyMap[objectName] = false;
    }
}
/**
 * Nullify all nested objects from nullifyMap that are nullable
 */
function applyNullifyMap(result, nullifyMap, joinsNotNullableMap) {
    if (!joinsNotNullableMap || Object.keys(nullifyMap).length === 0) {
        return;
    }
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
        if (typeof tableName === 'string' && !joinsNotNullableMap[tableName]) {
            result[objectName] = null;
        }
    }
}

var _a$1, _b;
class PowerSyncSQLiteTransaction extends session.SQLiteTransaction {
}
_a$1 = entity.entityKind;
PowerSyncSQLiteTransaction[_a$1] = 'PowerSyncSQLiteTransaction';
class PowerSyncSQLiteBaseSession extends session.SQLiteSession {
    constructor(db, dialect, schema, options = {}) {
        var _c;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new logger.NoopLogger();
    }
    prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
        return new PowerSyncSQLitePreparedQuery(this.db, query, this.logger, fields, executeMethod, isResponseInArrayMode, customResultMapper);
    }
    transaction(_transaction, _config = {}) {
        throw new Error('Nested transactions are not supported');
    }
}
_b = entity.entityKind;
PowerSyncSQLiteBaseSession[_b] = 'PowerSyncSQLiteBaseSession';

var _a;
class PowerSyncSQLiteSession extends PowerSyncSQLiteBaseSession {
    constructor(db, dialect, schema, options = {}) {
        super(db, dialect, schema, options);
        this.client = db;
    }
    transaction(transaction, config = {}) {
        let result;
        this.client.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            const tx = new PowerSyncSQLiteTransaction('sync', this.dialect, new PowerSyncSQLiteBaseSession(this.client, this.dialect, this.schema, this.options), 
            // trx,
            this.schema);
            result = this.internalTransaction(trx, () => transaction(tx), config);
        }));
        // @ts-ignore
        return result;
        // const { accessMode = 'read write' } = config;
        // if (accessMode === 'read only') {
        // return this.client.readLock(async (ctx) => this.internalTransaction(ctx, transaction, config)) as T;
        // return this.client.transaction(async (ctx) => this.internalTransaction(ctx, transaction, config));
        // }
        // return this.client.writeLock(async (ctx) => this.internalTransaction(ctx, transaction, config)) as T;
    }
    internalTransaction(transaction, fn, config = {}) {
        const tx = new PowerSyncSQLiteTransaction('sync', this.dialect, new PowerSyncSQLiteBaseSession(this.client, this.dialect, this.schema, this.options), this.schema);
        transaction.execute(`begin${(config === null || config === void 0 ? void 0 : config.behavior) ? ' ' + config.behavior : ''}`);
        try {
            const result = fn(tx);
            transaction.commit();
            return result;
        }
        catch (err) {
            transaction.rollback();
            throw err;
        }
    }
}
_a = entity.entityKind;
PowerSyncSQLiteSession[_a] = 'PowerSyncSQLiteSession';

class PowerSyncSQLiteDatabase extends db.BaseSQLiteDatabase {
    constructor(db, config = {}) {
        const dialect$1 = new dialect.SQLiteSyncDialect({ casing: config.casing });
        let logger$1;
        if (config.logger === true) {
            logger$1 = new logger.DefaultLogger();
        }
        else if (config.logger !== false) {
            logger$1 = config.logger;
        }
        let schema;
        if (config.schema) {
            const tablesConfig = relations.extractTablesRelationalConfig(config.schema, relations.createTableRelationsHelpers);
            schema = {
                fullSchema: config.schema,
                schema: tablesConfig.tables,
                tableNamesMap: tablesConfig.tableNamesMap
            };
        }
        const session = new PowerSyncSQLiteSession(db, dialect$1, schema, {
            logger: logger$1
        });
        super('sync', dialect$1, session, schema);
        this.db = db;
    }
    transaction(transaction, config) {
        return super.transaction(transaction, config);
    }
}
function wrapPowerSyncWithDrizzle(db, config = {}) {
    return new PowerSyncSQLiteDatabase(db, config);
}

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
function toCompilableQuery(query) {
    return {
        compile: () => {
            const sql = query.toSQL();
            return {
                sql: sql.sql,
                parameters: sql.params
            };
        },
        execute: () => __awaiter(this, void 0, void 0, function* () {
            const result = query.execute();
            return Array.isArray(result) ? result : [result];
        })
    };
}

function toPowerSyncTable(table, options) {
    var _a, _b;
    const { columns: drizzleColumns, indexes: drizzleIndexes } = sqliteCore.getTableConfig(table);
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
    return new common.Table(columns, Object.assign(Object.assign({}, options), { indexes }));
}
function mapDrizzleColumnToType(drizzleColumn) {
    switch (drizzleColumn.columnType) {
        case sqliteCore.SQLiteText[drizzleOrm.entityKind]:
        case sqliteCore.SQLiteTextJson[drizzleOrm.entityKind]:
            return common.column.text;
        case sqliteCore.SQLiteInteger[drizzleOrm.entityKind]:
        case sqliteCore.SQLiteTimestamp[drizzleOrm.entityKind]:
        case sqliteCore.SQLiteBoolean[drizzleOrm.entityKind]:
            return common.column.integer;
        case sqliteCore.SQLiteReal[drizzleOrm.entityKind]:
            return common.column.real;
        case sqliteCore.SQLiteCustomColumn[drizzleOrm.entityKind]:
            const sqlName = drizzleColumn.getSQLType();
            switch (sqlName) {
                case 'text':
                    return common.column.text;
                case 'integer':
                    return common.column.integer;
                case 'real':
                    return common.column.real;
                default:
                    throw new Error(`Unsupported custom column type: ${drizzleColumn.columnType}: ${sqlName}`);
            }
        default:
            throw new Error(`Unsupported column type: ${drizzleColumn.columnType}`);
    }
}
function toPowerSyncTables(schemaEntries, options) {
    const casingCache = (options === null || options === void 0 ? void 0 : options.casing) ? new casing.CasingCache(options === null || options === void 0 ? void 0 : options.casing) : undefined;
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
        if (drizzleOrm.isTable(maybeTable)) {
            const { name } = sqliteCore.getTableConfig(maybeTable);
            tables[name] = toPowerSyncTable(maybeTable, Object.assign(Object.assign({}, maybeOptions), { casingCache }));
        }
    }
    return tables;
}
class DrizzleAppSchema extends common.Schema {
    constructor(drizzleSchema, options) {
        super(toPowerSyncTables(drizzleSchema, options));
        // This is just used for typing
        this.types = {};
    }
}

exports.DrizzleAppSchema = DrizzleAppSchema;
exports.toCompilableQuery = toCompilableQuery;
exports.toPowerSyncTable = toPowerSyncTable;
exports.wrapPowerSyncWithDrizzle = wrapPowerSyncWithDrizzle;
//# sourceMappingURL=index.cjs.map
