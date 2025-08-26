var _a, _b;
import { entityKind } from 'drizzle-orm/entity';
import { NoopLogger } from 'drizzle-orm/logger';
import { SQLiteSession, SQLiteTransaction } from 'drizzle-orm/sqlite-core/session';
import { PowerSyncSQLitePreparedQuery } from './PowerSyncSQLitePreparedQuery.js';
export class PowerSyncSQLiteTransaction extends SQLiteTransaction {
}
_a = entityKind;
PowerSyncSQLiteTransaction[_a] = 'PowerSyncSQLiteTransaction';
export class PowerSyncSQLiteBaseSession extends SQLiteSession {
    constructor(db, dialect, schema, options = {}) {
        var _c;
        super(dialect);
        this.db = db;
        this.dialect = dialect;
        this.schema = schema;
        this.options = options;
        this.logger = (_c = options.logger) !== null && _c !== void 0 ? _c : new NoopLogger();
    }
    prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
        return new PowerSyncSQLitePreparedQuery(this.db, query, this.logger, fields, executeMethod, isResponseInArrayMode, customResultMapper);
    }
    transaction(_transaction, _config = {}) {
        throw new Error('Nested transactions are not supported');
    }
}
_b = entityKind;
PowerSyncSQLiteBaseSession[_b] = 'PowerSyncSQLiteBaseSession';
//# sourceMappingURL=PowerSyncSQLiteBaseSession.js.map