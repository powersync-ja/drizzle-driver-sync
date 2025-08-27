/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import {
  Button,
  FlatList,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PowerSyncContext } from '@powersync/react-native';
import { eq } from 'drizzle-orm';
import {
  drizzleLists,
  drizzleTodos,
  SystemContext,
  useSystem,
} from './SystemContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent(): React.JSX.Element {
  const system = useSystem();
  // const [initialized, setInitialized] = React.useState(false);
  useEffect(() => {
    const initialize = async () => {
      try {
        await system.init();
        console.log('System initialized successfully');
        // setInitialized(true);
        // const lists = await system.powersync.get("SELECT * FROM lists");
        // console.log('Initial lists:', lists);
      } catch (error) {
        console.error('Error initializing system:', error);
      }
    };
    initialize();
  }, []);

  return (
    <SystemContext.Provider value={system}>
      <PowerSyncContext.Provider value={system.powersync}>
        <SafeAreaView>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 25,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginVertical: 10,
                  textAlign: 'center',
                }}
              >
                Sync OpSQLite List
              </Text>
              <SyncList />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginVertical: 10,
                  textAlign: 'center',
                }}
              >
                Sync Drizzle List
              </Text>
              <SyncDrizzleList />
            </View>
          </View>
        </SafeAreaView>
      </PowerSyncContext.Provider>
    </SystemContext.Provider>
  );
}

function SyncDrizzleList() {
  const system = useSystem();
  const [lists, setLists] = React.useState(
    system.drizzleSync
      .select()
      .from(drizzleLists)
      .leftJoin(drizzleTodos, eq(drizzleLists.id, drizzleTodos.list_id))
      .all(),
  );

  // Listens for changes from PowerSync updates
  useEffect(() => {
    const disposeChange = system.powersync.onChangeWithCallback(
      {
        onChange: () => {
          setLists(
            system.drizzleSync
              .select()
              .from(drizzleLists)
              .leftJoin(drizzleTodos, eq(drizzleLists.id, drizzleTodos.list_id))
              .all(),
          );
        },
      },
      {
        tables: ['lists'],
      },
    );

    return () => {
      disposeChange();
    };
  }, []);

  return (
    <View>
      <FlatList
        data={lists.flatMap(list => list.lists)}
        renderItem={({ item: list, index }) => (
          <View
            key={`${list.id}${index}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                marginVertical: 5,
                padding: 10,
                backgroundColor: '#f0f0f0',
                borderRadius: 5,
              }}
            >
              {list.name}
            </Text>
            <Button
              title="X"
              onPress={() => {
                system.drizzleSync
                  .delete(drizzleLists)
                  .where(eq(drizzleLists.id, list.id!))
                  .run();
              }}
            ></Button>
          </View>
        )}
      />
      <Button
        title="Add List"
        onPress={() => {
          const id = Math.floor(Math.random() * 1000);
          system.drizzleSync
            .insert(drizzleLists)
            .values({
              id: id.toString(),
              name: `List ${id}`,
            })
            .run();
        }}
      />
    </View>
  );
}

function SyncList() {
  const [lists, setLists] = React.useState<{ id: string; name: string }[]>([]);
  const system = useSystem();
  const { opSqlite } = system;

  const getLists = () => {
    if (!opSqlite) return;

    try {
      const result = opSqlite.executeSync('SELECT * FROM lists');
      setLists(
        result.rows.map(row => ({
          id: row.id as string,
          name: row.name as string,
        })),
      );
    } catch (error) {
      console.error('Error fetching lists:', error);
      return;
    }
  };

  // Queue up transactions from ps_crud
  const flushCrudTransactions = async () => {
    await system.connector.uploadData(system.powersync);
  };

  // Intial update of lists
  useEffect(() => {
    getLists();
  }, [opSqlite]);

  // Listens for changes from PowerSync updates
  useEffect(() => {
    const disposeChange = system.powersync.onChangeWithCallback(
      {
        onChange: () => {
          getLists();
        },
      },
      {
        tables: ['lists'],
      },
    );

    return () => {
      disposeChange();
    };
  }, []);

  return (
    <View>
      <FlatList
        data={lists}
        renderItem={({ item: list }) => (
          <View
            key={list.id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                marginVertical: 5,
                padding: 10,
                backgroundColor: '#f0f0f0',
                borderRadius: 5,
              }}
            >
              {list.name}
            </Text>
            <Button
              title="X"
              onPress={() => {
                const id = Math.floor(Math.random() * 1000);
                opSqlite.executeSync(
                  'INSERT INTO ps_crud (id, data, tx_id) VALUES(?, ?, ?)',
                  [
                    id,
                    JSON.stringify({
                      op: 'DELETE',
                      type: 'lists',
                      id: list.id,
                    }),
                    id,
                  ],
                );
                flushCrudTransactions();
                getLists();
              }}
            ></Button>
          </View>
        )}
      />
      <Button
        title="Add List"
        onPress={() => {
          const id = Math.floor(Math.random() * 1000);
          opSqlite.executeSync(
            'INSERT INTO ps_crud (id, data, tx_id) VALUES(?, ?, ?)',
            [
              id,
              JSON.stringify({
                op: 'PUT',
                type: 'lists',
                id,
                data: {
                  name: `List ${id}`,
                },
              }),
            ],
          );
          flushCrudTransactions();
          getLists();
        }}
      />
    </View>
  );
}

export default App;
