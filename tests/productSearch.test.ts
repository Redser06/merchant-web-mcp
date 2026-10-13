import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProductSearchQuery, CATALOG_COLUMNS, searchProducts } from '../server-examples/productSearch';

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

  it('rejects a max_price that is not a finite number >= 0', () => {
    expect(() => buildProductSearchQuery({ query: 'tent', max_price: -1 })).toThrow(/max_price/);
    expect(() => buildProductSearchQuery({ query: 'tent', max_price: Number.NaN })).toThrow(/max_price/);
    expect(() => buildProductSearchQuery({ query: 'tent', max_price: Number.POSITIVE_INFINITY })).toThrow(/max_price/);
  });

  it('matches the catalog schema fixture for category, description, and waterproof', () => {
    const schema = readFileSync(join(import.meta.dir, '../server-examples/catalog.sql'), 'utf8');
    for (const column of CATALOG_COLUMNS) {
      expect(schema).toContain(column);
    }
    expect(schema).toContain("'Packs'");
    expect(schema).toContain('Waterproof roll-top pack');
    expect(schema).toContain('waterproof INTEGER');

    const { sql } = buildProductSearchQuery(allFilters);
    for (const column of ['title', 'description', 'category', 'price', 'waterproof', 'id', 'in_stock']) {
      expect(sql).toContain(column);
      expect(schema).toContain(column);
    }
  });
});
