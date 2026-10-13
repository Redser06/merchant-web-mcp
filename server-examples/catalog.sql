CREATE TABLE products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  waterproof INTEGER NOT NULL CHECK (waterproof IN (0, 1)),
  in_stock INTEGER NOT NULL
);

INSERT INTO products (id, title, description, category, price, waterproof, in_stock)
VALUES (
  'summit_40l',
  'Summit 40L Waterproof Backpack',
  'Waterproof roll-top pack',
  'Packs',
  89.00,
  1,
  1
);
