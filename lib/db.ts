import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSQL(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    _sql = neon(url);
  }
  return _sql;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
  return getSQL()(strings, ...values);
}) as NeonQueryFunction<false, false>;

// Attach query method for dynamic SQL
sql.query = ((query: string, params?: unknown[]) => {
  return getSQL().query(query, params);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

// Attach transaction method
sql.transaction = ((queries: unknown[], opts?: unknown) => {
  return getSQL().transaction(queries as Parameters<NeonQueryFunction<false, false>['transaction']>[0], opts as Parameters<NeonQueryFunction<false, false>['transaction']>[1]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export default sql;
