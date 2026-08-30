import { createHash } from 'node:crypto';
import { pool } from '../../config/db';

/**
 * Deterministic UUIDv5-style id derived from the product name.
 * Same name in -> same id out, forever. This is what makes the seed
 * idempotent: UNIQUE (owner_user_id, name) cannot constrain seeded rows
 * (NULL != NULL), but the PRIMARY KEY always can.
 */
function seedId(name: string): string {
  const h = createHash('sha1').update(`good-fit/seed/${name}`).digest('hex');
  const version = '5' + h.slice(13, 16);
  const variant =
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    version,
    variant,
    h.slice(20, 32),
  ].join('-');
}

interface SeedProduct {
  name: string;
  brand?: string;
  kcal100g: number;
  fat100g: number;
  protein100g: number;
  carb100g: number;
  sugar100g?: number;
  salt100g?: number;
}

// Replace these with foods YOU eat. Numbers below are per 100g.
const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: 'Banana',
    kcal100g: 89,
    fat100g: 0.3,
    protein100g: 1.1,
    carb100g: 22.8,
    sugar100g: 12.2,
    salt100g: 0,
  },
  {
    name: 'Apple',
    kcal100g: 52,
    fat100g: 0.2,
    protein100g: 0.3,
    carb100g: 13.8,
    sugar100g: 10.4,
    salt100g: 0,
  },
  {
    name: 'Chicken breast, raw',
    kcal100g: 120,
    fat100g: 2.6,
    protein100g: 22.5,
    carb100g: 0,
    sugar100g: 0,
    salt100g: 0.1,
  },
  {
    name: 'Salmon fillet, raw',
    kcal100g: 208,
    fat100g: 13.4,
    protein100g: 20.4,
    carb100g: 0,
    sugar100g: 0,
    salt100g: 0.1,
  },
  {
    name: 'Egg, whole',
    kcal100g: 143,
    fat100g: 9.5,
    protein100g: 12.6,
    carb100g: 0.7,
    sugar100g: 0.4,
    salt100g: 0.4,
  },
  {
    name: 'Rolled oats',
    kcal100g: 379,
    fat100g: 6.5,
    protein100g: 13.2,
    carb100g: 67.7,
    sugar100g: 0.99,
    salt100g: 0,
  },
  {
    name: 'White rice, dry',
    kcal100g: 365,
    fat100g: 0.7,
    protein100g: 7.1,
    carb100g: 80,
    sugar100g: 0.1,
    salt100g: 0,
  },
  {
    name: 'Pasta, dry',
    kcal100g: 371,
    fat100g: 1.5,
    protein100g: 13,
    carb100g: 74.7,
    sugar100g: 2.7,
    salt100g: 0,
  },
  {
    name: 'Potato, raw',
    kcal100g: 77,
    fat100g: 0.1,
    protein100g: 2,
    carb100g: 17.5,
    sugar100g: 0.8,
    salt100g: 0,
  },
  {
    name: 'Broccoli, raw',
    kcal100g: 34,
    fat100g: 0.4,
    protein100g: 2.8,
    carb100g: 6.6,
    sugar100g: 1.7,
    salt100g: 0,
  },
  {
    name: 'Carrot, raw',
    kcal100g: 41,
    fat100g: 0.2,
    protein100g: 0.9,
    carb100g: 9.6,
    sugar100g: 4.7,
    salt100g: 0.1,
  },
  {
    name: 'Tomato',
    kcal100g: 18,
    fat100g: 0.2,
    protein100g: 0.9,
    carb100g: 3.9,
    sugar100g: 2.6,
    salt100g: 0,
  },
  {
    name: 'Cucumber',
    kcal100g: 15,
    fat100g: 0.1,
    protein100g: 0.7,
    carb100g: 3.6,
    sugar100g: 1.7,
    salt100g: 0,
  },
  {
    name: 'Avocado',
    kcal100g: 160,
    fat100g: 14.7,
    protein100g: 2,
    carb100g: 8.5,
    sugar100g: 0.7,
    salt100g: 0,
  },
  {
    name: 'Olive oil',
    kcal100g: 884,
    fat100g: 100,
    protein100g: 0,
    carb100g: 0,
    sugar100g: 0,
    salt100g: 0,
  },
  {
    name: 'Butter',
    kcal100g: 717,
    fat100g: 81.1,
    protein100g: 0.9,
    carb100g: 0.1,
    sugar100g: 0.1,
    salt100g: 1.6,
  },
  {
    name: 'Whole milk',
    kcal100g: 61,
    fat100g: 3.3,
    protein100g: 3.2,
    carb100g: 4.8,
    sugar100g: 5.1,
    salt100g: 0.1,
  },
  {
    name: 'Greek yoghurt, plain',
    kcal100g: 59,
    fat100g: 0.4,
    protein100g: 10,
    carb100g: 3.6,
    sugar100g: 3.2,
    salt100g: 0.1,
  },
  {
    name: 'Cheddar cheese',
    kcal100g: 403,
    fat100g: 33.1,
    protein100g: 24.9,
    carb100g: 1.3,
    sugar100g: 0.5,
    salt100g: 1.8,
  },
  {
    name: 'Cottage cheese',
    kcal100g: 98,
    fat100g: 4.3,
    protein100g: 11.1,
    carb100g: 3.4,
    sugar100g: 2.7,
    salt100g: 0.4,
  },
  {
    name: 'Wholemeal bread',
    kcal100g: 247,
    fat100g: 3.4,
    protein100g: 13,
    carb100g: 41,
    sugar100g: 4.3,
    salt100g: 1.2,
  },
  {
    name: 'Almonds',
    kcal100g: 579,
    fat100g: 49.9,
    protein100g: 21.2,
    carb100g: 21.6,
    sugar100g: 4.4,
    salt100g: 0,
  },
  {
    name: 'Walnuts',
    kcal100g: 654,
    fat100g: 65.2,
    protein100g: 15.2,
    carb100g: 13.7,
    sugar100g: 2.6,
    salt100g: 0,
  },
  {
    name: 'Peanut butter',
    kcal100g: 588,
    fat100g: 50,
    protein100g: 25,
    carb100g: 20,
    sugar100g: 9.2,
    salt100g: 0.5,
  },
  {
    name: 'Lentils, dry',
    kcal100g: 352,
    fat100g: 1.1,
    protein100g: 24.6,
    carb100g: 63.4,
    sugar100g: 2.0,
    salt100g: 0,
  },
  {
    name: 'Chickpeas, canned',
    kcal100g: 139,
    fat100g: 2.6,
    protein100g: 7.1,
    carb100g: 22.5,
    sugar100g: 0.4,
    salt100g: 0.3,
  },
  {
    name: 'Tofu, firm',
    kcal100g: 144,
    fat100g: 8.7,
    protein100g: 17.3,
    carb100g: 2.8,
    sugar100g: 0.6,
    salt100g: 0,
  },
  {
    name: 'Beef mince, 5% fat',
    kcal100g: 137,
    fat100g: 5,
    protein100g: 21.6,
    carb100g: 0,
    sugar100g: 0,
    salt100g: 0.2,
  },
  {
    name: 'Dark chocolate 70%',
    kcal100g: 598,
    fat100g: 42.6,
    protein100g: 7.8,
    carb100g: 45.9,
    sugar100g: 24,
    salt100g: 0,
  },
  // Genuinely unknown sugar/salt - left NULL on purpose, never faked as 0:
  {
    name: "Mum's vegetable soup",
    kcal100g: 48,
    fat100g: 1.9,
    protein100g: 1.6,
    carb100g: 6.4,
  },
];

async function main(): Promise<void> {
  let written = 0;
  for (const p of SEED_PRODUCTS) {
    await pool.query(
      `INSERT INTO products
         (id, owner_user_id, source, name, brand,
          kcal_100g, fat_100g, protein_100g, carb_100g, sugar_100g, salt_100g)
       VALUES (?, NULL, 'seed', ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name         = VALUES(name),
         brand        = VALUES(brand),
         kcal_100g    = VALUES(kcal_100g),
         fat_100g     = VALUES(fat_100g),
         protein_100g = VALUES(protein_100g),
         carb_100g    = VALUES(carb_100g),
         sugar_100g   = VALUES(sugar_100g),
         salt_100g    = VALUES(salt_100g),
         deleted_at   = NULL`,
      [
        seedId(p.name),
        p.name,
        p.brand ?? null,
        p.kcal100g,
        p.fat100g,
        p.protein100g,
        p.carb100g,
        p.sugar100g ?? null,
        p.salt100g ?? null,
      ],
    );
    written += 1;
  }
  console.log(`Seeded ${written} products.`);
  await pool.end();
}

void main().catch((err) => {
  console.error('Seed failed:', err);
  void pool.end().finally(() => process.exit(1));
});
