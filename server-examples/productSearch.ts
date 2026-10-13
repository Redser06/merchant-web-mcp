/**
 * Catalog search used by the Cloudflare Worker example.
 * Every filter the search_products tool accepts is applied here.
 */

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  max_price?: number;
  waterproof_only?: boolean;
}

export interface SqlStatement {
  bind(...params: unknown[]): {
    all(): Promise<{ results: unknown[] }>;
  };
}

export interface CatalogDb {
  prepare(sql: string): SqlStatement;
}

export interface ProductSearchQuery {
  sql: string;
  params: unknown[];
}

function likeContains(value: string): string {
  const escaped = value.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

/**
 * Builds a parameterized D1 query. Optional filters are omitted when absent.
 * max_price falls back to the example's previous ceiling only when unset.
 */
export function buildProductSearchQuery(filters: ProductSearchFilters): ProductSearchQuery {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const query = filters.query?.trim();
  if (query) {
    clauses.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    const pattern = likeContains(query);
    params.push(pattern, pattern);
  }

  if (filters.category) {
    clauses.push('category = ?');
    params.push(filters.category);
  }

  clauses.push('price <= ?');
  params.push(filters.max_price ?? 9999);

  if (filters.waterproof_only) {
    clauses.push('waterproof = 1');
  }

  const where = clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
  return {
    sql: `SELECT id, title, price, in_stock FROM products${where} LIMIT 10`,
    params,
  };
}

export async function searchProducts(
  db: CatalogDb,
  filters: ProductSearchFilters,
): Promise<unknown[]> {
  const { sql, params } = buildProductSearchQuery(filters);
  const items = await db.prepare(sql).bind(...params).all();
  return items.results;
}
