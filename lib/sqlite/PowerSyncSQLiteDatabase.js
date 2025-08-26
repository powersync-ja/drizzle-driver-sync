import { DefaultLogger } from 'drizzle-orm/logger';
import { createTableRelationsHelpers, extractTablesRelationalConfig } from 'drizzle-orm/relations';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core/dialect';
import { PowerSyncSQLiteSession } from './PowerSyncSQLiteSession.js';
export class PowerSyncSQLiteDatabase extends BaseSQLiteDatabase {
    constructor(db, config = {}) {
        const dialect = new SQLiteSyncDialect({ casing: config.casing });
        let logger;
        if (config.logger === true) {
            logger = new DefaultLogger();
        }
        else if (config.logger !== false) {
            logger = config.logger;
        }
        let schema;
        if (config.schema) {
            const tablesConfig = extractTablesRelationalConfig(config.schema, createTableRelationsHelpers);
            schema = {
                fullSchema: config.schema,
                schema: tablesConfig.tables,
                tableNamesMap: tablesConfig.tableNamesMap
            };
        }
        const session = new PowerSyncSQLiteSession(db, dialect, schema, {
            logger
        });
        super('sync', dialect, session, schema);
        this.db = db;
    }
    transaction(transaction, config) {
        return super.transaction(transaction, config);
    }
}
export function wrapPowerSyncWithDrizzle(db, config = {}) {
    return new PowerSyncSQLiteDatabase(db, config);
}
//# sourceMappingURL=PowerSyncSQLiteDatabase.js.map