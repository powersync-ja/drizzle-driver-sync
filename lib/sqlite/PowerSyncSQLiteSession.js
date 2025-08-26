var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { entityKind } from 'drizzle-orm/entity';
import { PowerSyncSQLiteBaseSession, PowerSyncSQLiteTransaction } from './PowerSyncSQLiteBaseSession.js';
export class PowerSyncSQLiteSession extends PowerSyncSQLiteBaseSession {
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
_a = entityKind;
PowerSyncSQLiteSession[_a] = 'PowerSyncSQLiteSession';
//# sourceMappingURL=PowerSyncSQLiteSession.js.map