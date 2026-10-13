import { describe, expect, it } from 'bun:test';
import { buildProductSearchQuery, searchProducts } from '../server-examples/productSearch';

const allFilters = {
  query: '100% backpack',
  category: 'Packs',
  max_price: 100,
  waterproof_only: true,
};

describe('worker product search filters', () => {
  it('binds query, category, max_price, and waterproof_only into the catalog query', async () => {
    const { sql, params } = buildProductSearchQuery(allFilters);

    expect(sql).toContain("title LIKE ? ESCAPE '\\'");
    expect(sql).toContain("description LIKE ? ESCAPE '\\'");
    expect(sql).toContain('category = ?');
    expect(sql).toContain('price <= ?');
    expect(sql).toContain('waterproof = 1');
    expect(params).toEqual(['%100\\% backpack%', '%100\\% backpack%', 'Packs', 100]);

    let seenSql = '';
    let seenParams: unknown[] = [];
    const results = await searchProducts(
      {
        prepare(prepared) {
          seenSql = prepared;
          return {
            bind(...bound: unknown[]) {
              seenParams = bound;
              return { async all() { return { results: [{ id: 'summit_40l' }] }; } };
            },
          };
        },
      },
      allFilters,
    );

    expect(seenSql).toBe(sql);
    expect(seenParams).toEqual(params);
    expect(results).toEqual([{ id: 'summit_40l' }]);
  });

  it('omits category and waterproof filters that were not requested', () => {
    const { sql, params } = buildProductSearchQuery({ query: 'tent' });

    expect(sql).not.toContain('category =');
    expect(sql).not.toContain('waterproof');
    expect(params).toEqual(['%tent%', '%tent%', 9999]);
  });

  it('honours max_price of 0 and does not treat waterproof_only false as a constraint', () => {
    const { sql, params } = buildProductSearchQuery({
      query: 'jacket',
      waterproof_only: false,
      max_price: 0,
    });

    expect(sql).not.toContain('waterproof');
    expect(params).toEqual(['%jacket%', '%jacket%', 0]);
  });
});
