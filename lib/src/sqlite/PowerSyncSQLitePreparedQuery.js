var _a;
import { Column, getTableName, SQL } from 'drizzle-orm';
import { entityKind, is } from 'drizzle-orm/entity';
import { fillPlaceholders } from 'drizzle-orm/sql/sql';
import { ExecuteResultSync, SQLitePreparedQuery } from 'drizzle-orm/sqlite-core/session';
export class PowerSyncSQLitePreparedQuery extends SQLitePreparedQuery {
    constructor(db, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        super('sync', executeMethod, query);
        this.db = db;
        this.logger = logger;
        this.fields = fields;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
    }
    execute(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeRawSync(this.query.sql, params);
        return new ExecuteResultSync(() => {
            return this.mapResult(rs, false);
        });
    }
    run(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        const rs = this.db.executeSync(this.query.sql, params);
        return rs;
    }
    all(placeholderValues) {
        var _b;
        const { fields, query, logger, customResultMapper } = this;
        if (!fields && !customResultMapper) {
            const params = fillPlaceholders(query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
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
        const params = fillPlaceholders(this.query.params, placeholderValues !== null && placeholderValues !== void 0 ? placeholderValues : {});
        this.logger.logQuery(this.query.sql, params);
        return this.db.executeRawSync(this.query.sql, params);
    }
    isResponseInArrayMode() {
        return this._isResponseInArrayMode;
    }
}
_a = entityKind;
PowerSyncSQLitePreparedQuery[_a] = 'PowerSyncSQLitePreparedQuery';
/**
 * Maps a database row object to a result object based on the provided column definitions.
 * It reconstructs the hierarchical structure of the result by following the specified paths for each field.
 * It also handles nullification of nested objects when joined tables are nullable.
 */
export function mapResultRow(columns, row, joinsNotNullableMap) {
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
    if (is(field, Column)) {
        return field;
    }
    else if (is(field, SQL)) {
        return field.decoder;
    }
    else {
        return field.sql.decoder;
    }
}
function updateNullifyMap(nullifyMap, field, path, value, joinsNotNullableMap) {
    if (!joinsNotNullableMap || !is(field, Column) || path.length !== 2) {
        return;
    }
    const objectName = path[0];
    if (!(objectName in nullifyMap)) {
        nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
    }
    else if (typeof nullifyMap[objectName] === 'string' && nullifyMap[objectName] !== getTableName(field.table)) {
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
//# sourceMappingURL=PowerSyncSQLitePreparedQuery.js.map