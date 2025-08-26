var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export function toCompilableQuery(query) {
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
//# sourceMappingURL=compilableQuery.js.map