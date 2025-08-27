import React from 'react';
import { open } from '@op-engineering/op-sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  AbstractPowerSyncDatabase,
  createBaseLogger,
  LogLevel,
  PowerSyncDatabase,
} from '@powersync/react-native';
import {
  DrizzleAppSchema,
  PowerSyncSQLiteDatabase,
  PowerSyncSQLiteDatabase as PowerSyncSQLiteDatabaseSync,
  wrapPowerSyncWithDrizzle,
  wrapPowerSyncWithDrizzle as wrapPowerSyncWithDrizzleSync,
} from '@powersync/drizzle-driver-sync';
import { relations } from 'drizzle-orm';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';

const logger = createBaseLogger();
logger.useDefaults();
logger.setLevel(LogLevel.DEBUG);

export class SelfhostConnector {
  private _clientId: string | null = null;

  async fetchCredentials() {
    const token = await fetch('http://localhost:6060/api/auth/token')
      .then(response => response.json())
      .then(data => data.token);

    console.log('Fetched token:', token);
    return {
      endpoint: 'http://localhost:8080',
      token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    if (!this._clientId) {
      this._clientId = await database.getClientId();
    }

    try {
      let batch: any[] = [];
      for (let operation of transaction.crud) {
        let payload = {
          op: operation.op,
          table: operation.table,
          id: operation.id,
          data: operation.opData,
        };
        batch.push(payload);
      }

      const response = await fetch(`http://localhost:6060/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch }),
      });

      if (!response.ok) {
        throw new Error(
          `Received ${
            response.status
          } from /api/data: ${await response.text()}`,
        );
      }

      await transaction
        .complete
        // import.meta.env.VITE_CHECKPOINT_MODE == CheckpointMode.CUSTOM
        //   ? await this.getCheckpoint(this._clientId)
        //   : undefined
        ();
      console.log('Transaction completed successfully');
    } catch (ex: any) {
      console.debug(ex);
      throw ex;
    }
  }
}

export const drizzleLists = sqliteTable('lists', {
  id: text('id'),
  name: text('name'),
});

export const drizzleTodos = sqliteTable('todos', {
  id: text('id'),
  description: text('description'),
  list_id: text('list_id'),
  created_at: text('created_at'),
});

export const listsRelations = relations(drizzleLists, ({ one, many }) => ({
  todos: many(drizzleTodos),
}));

export const todosRelations = relations(drizzleTodos, ({ one, many }) => ({
  list: one(drizzleLists, {
    fields: [drizzleTodos.list_id],
    references: [drizzleLists.id],
  }),
}));

const drizzleSchema = {
  lists: drizzleLists,
  todos: drizzleTodos,
  listsRelations,
  todosRelations,
};

const schema = new DrizzleAppSchema(drizzleSchema);

export const DB_NAME = 'powersync-test-2.db';

export class System {
  connector: SelfhostConnector;
  powersync: PowerSyncDatabase;
  drizzleSync: PowerSyncSQLiteDatabase<typeof drizzleSchema>;
  opSqlite: ReturnType<typeof open>;

  constructor() {
    this.connector = new SelfhostConnector();
    this.powersync = new PowerSyncDatabase({
      schema,
      database: new OPSqliteOpenFactory({
        dbFilename: DB_NAME
      }),
    //   database: {
    //     dbFilename: DB_NAME,
    //   },
      logger,
    });

    this.opSqlite = open({
      name: DB_NAME,
    });
    this.drizzleSync = wrapPowerSyncWithDrizzle(this.opSqlite, {
      schema: drizzleSchema,
    });
  }

  async init() {
    await this.powersync.init();
    await this.powersync.connect(this.connector, {
      // clientImplementation: SyncClientImplementation.RUST
    });

    await this.powersync.waitForFirstSync();
  }
}

const system = new System();
export const SystemContext = React.createContext(system);
export const useSystem = () => React.useContext(SystemContext);
