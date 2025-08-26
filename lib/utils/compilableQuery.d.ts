import { CompilableQuery } from '@powersync/common';
import { Query } from 'drizzle-orm';
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
export declare function toCompilableQuery<T>(query: {
    execute: () => T | T[];
    toSQL: () => Query;
}): CompilableQuery<T>;
