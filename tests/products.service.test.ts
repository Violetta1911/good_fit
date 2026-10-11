import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;
let productsService: typeof import('../src/modules/products/products.service').default;
let usersService: typeof import('../src/modules/users/users.service').default;
let userA: string;
let userB: string;
let ids: Record<string, string>;

interface ProductFixture {
  ownerUserId?: string | null;
  name: string;
  brand?: string | null;
  kcal100g?: number;
  fat100g?: number;
  protein100g?: number;
  carb100g?: number;
  sugar100g?: number | null;
  salt100g?: number | null;
  deleted?: boolean;
}

async function insertProduct(pool: Pool, fixture: ProductFixture): Promise<string> {
  const id = randomUUID();
  const {
    ownerUserId = null,
    name,
    brand = null,
    kcal100g = 100,
    fat100g = 1,
    protein100g = 1,
    carb100g = 1,
    sugar100g = null,
    salt100g = null,
    deleted = false,
  } = fixture;

  await pool.query<ResultSetHeader>(
    `INSERT INTO products
      (id, owner_user_id, source, source_ref, name, brand,
       kcal_100g, fat_100g, protein_100g, carb_100g, sugar_100g, salt_100g, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      ownerUserId,
      ownerUserId ? 'user' : 'seed',
      null,
      name,
      brand,
      kcal100g,
      fat100g,
      protein100g,
      carb100g,
      sugar100g,
      salt100g,
      deleted ? new Date() : null,
    ],
  );
  return id;
}

async function seedBaseFixtures(): Promise<Record<string, string>> {
  return {
    aChicken: await insertProduct(pool, { ownerUserId: userA, name: 'A Chicken' }),
    aBanana: await insertProduct(pool, { ownerUserId: userA, name: 'A Banana' }),
    aDeleted: await insertProduct(pool, {
      ownerUserId: userA, name: 'A Deleted Thing', deleted: true,
    }),
    bSecret: await insertProduct(pool, { ownerUserId: userB, name: 'B Secret Cake' }),
    seededBanana: await insertProduct(pool, { ownerUserId: null, name: 'Banana' }),
    seededBread: await insertProduct(pool, { ownerUserId: null, name: 'Bread' }),
    deadSeed: await insertProduct(pool, {
      ownerUserId: null, name: 'Dead Seed', deleted: true,
    }),
  };
}

beforeAll(async () => {
  ({ pool, dbName } = await createTestDb());
  vi.doMock('../src/config/db', () => ({ pool }));
  productsService = (await import('../src/modules/products/products.service')).default;
  usersService = (await import('../src/modules/users/users.service')).default;

  const a = await usersService.createUser({
    email: 'products-a@x.co', password: 'longpassword1', name: 'A', timezone: 'UTC',
  });
  const b = await usersService.createUser({
    email: 'products-b@x.co', password: 'longpassword1', name: 'B', timezone: 'UTC',
  });
  userA = a.id;
  userB = b.id;
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM products');
  ids = await seedBaseFixtures();
});

describe('productsService.list visibility', () => {
  it('returns own products plus seeded ones, and not another user\'s', async () => {
    const { items } = await productsService.list(userA, { limit: 50, offset: 0 });
    const names = items.map((p) => p.name);
    expect(names.sort()).toEqual(['A Banana', 'A Chicken', 'Banana', 'Bread']);
    expect(names).not.toContain('B Secret Cake');
  });

  it("is the mirror image for B: sees its own plus seeded, never A's", async () => {
    const { items } = await productsService.list(userB, { limit: 50, offset: 0 });
    const names = items.map((p) => p.name);
    expect(names.sort()).toEqual(['B Secret Cake', 'Banana', 'Bread'].sort());
    expect(names).not.toContain('A Chicken');
    expect(names).not.toContain('A Banana');
  });

  it('excludes soft-deleted rows, both own and seeded', async () => {
    const { items } = await productsService.list(userA, { limit: 50, offset: 0 });
    const names = items.map((p) => p.name);
    expect(names).not.toContain('A Deleted Thing');
    expect(names).not.toContain('Dead Seed');
  });
});

describe('productsService.list search', () => {
  it('filters by substring, case-insensitively, via collation (no LOWER() needed)', async () => {
    const { items } = await productsService.list(userA, { q: 'ban', limit: 50, offset: 0 });
    expect(items.map((p) => p.name).sort()).toEqual(['A Banana', 'Banana']);
  });

  it('search still respects visibility: a match owned by another user never leaks', async () => {
    await insertProduct(pool, { ownerUserId: userB, name: 'B Banana Bread' });
    const { items } = await productsService.list(userA, { q: 'ban', limit: 50, offset: 0 });
    expect(items.map((p) => p.name)).not.toContain('B Banana Bread');
  });

  it('treats % and _ as literal characters, not SQL wildcards', async () => {
    const percent = await productsService.list(userA, { q: '%', limit: 50, offset: 0 });
    expect(percent.items).toEqual([]);

    const underscore = await productsService.list(userA, { q: '_', limit: 50, offset: 0 });
    expect(underscore.items).toEqual([]);

    await insertProduct(pool, { ownerUserId: null, name: '100% Juice' });
    const found = await productsService.list(userA, { q: '100%', limit: 50, offset: 0 });
    expect(found.items.map((p) => p.name)).toEqual(['100% Juice']);
  });
});

describe('productsService.list pagination', () => {
  it('pages are disjoint by id and concatenate to the full ordered list', async () => {
    const page1 = await productsService.list(userA, { limit: 2, offset: 0 });
    const page2 = await productsService.list(userA, { limit: 2, offset: 2 });
    const page1Ids = page1.items.map((p) => p.id);
    const page2Ids = page2.items.map((p) => p.id);

    expect(page1Ids).toHaveLength(2);
    expect(page2Ids).toHaveLength(2);
    expect(page1Ids.filter((id) => page2Ids.includes(id))).toEqual([]);

    const full = await productsService.list(userA, { limit: 50, offset: 0 });
    expect([...page1Ids, ...page2Ids]).toEqual(full.items.map((p) => p.id));
  });

  it('total reflects the full filtered count, independent of limit/offset', async () => {
    const page = await productsService.list(userA, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(4);

    const searched = await productsService.list(userA, { q: 'ban', limit: 1, offset: 0 });
    expect(searched.items).toHaveLength(1);
    expect(searched.total).toBe(2);
  });

  it('echoes back the limit and offset it was called with', async () => {
    const result = await productsService.list(userA, { limit: 2, offset: 2 });
    expect(result.limit).toBe(2);
    expect(result.offset).toBe(2);
  });

  it('orders by name ascending with a stable tiebreak across repeated calls', async () => {
    await insertProduct(pool, { ownerUserId: userA, name: 'Bread' });

    const first = await productsService.list(userA, { limit: 50, offset: 0 });
    const second = await productsService.list(userA, { limit: 50, offset: 0 });
    expect(first.items.map((p) => p.id)).toEqual(second.items.map((p) => p.id));

    const breadRows = first.items.filter((p) => p.name === 'Bread');
    expect(breadRows).toHaveLength(2);
  });
});

describe('productsService.getById', () => {
  it("returns the caller's own product and a seeded product", async () => {
    const own = await productsService.getById(userA, ids.aChicken);
    expect(own?.name).toBe('A Chicken');

    const seeded = await productsService.getById(userA, ids.seededBanana);
    expect(seeded?.name).toBe('Banana');
  });

  it('returns null for every invisible case', async () => {
    expect(await productsService.getById(userA, ids.bSecret)).toBeNull();
    expect(await productsService.getById(userA, ids.aDeleted)).toBeNull();
    expect(await productsService.getById(userA, ids.deadSeed)).toBeNull();
    expect(await productsService.getById(userA, randomUUID())).toBeNull();
  });
});

describe('productsService macro shape', () => {
  it('returns macros as numbers, with unknown sugar as null (not 0 or "null")', async () => {
    const unknownSugarId = await insertProduct(pool, {
      ownerUserId: userA, name: 'Mystery Bar', sugar100g: null,
    });
    const product = await productsService.getById(userA, unknownSugarId);
    expect(typeof product?.kcal100g).toBe('number');
    expect(product?.sugar100g).toBeNull();
  });
});
