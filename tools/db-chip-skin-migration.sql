-- Run this script on your blackjack database.
-- It normalizes skin columns and seeds chip products for shop.

START TRANSACTION;

-- 1) Ensure user table has skin selection columns.
ALTER TABLE user
  ADD COLUMN IF NOT EXISTS cardId INT NULL,
  ADD COLUMN IF NOT EXISTS chipId INT NULL,
  ADD COLUMN IF NOT EXISTS tableId INT NULL,
  ADD COLUMN IF NOT EXISTS themeId INT NULL;

-- 2) Ensure product table has path column used by backend/frontend.
ALTER TABLE product
  ADD COLUMN IF NOT EXISTS path VARCHAR(255) NOT NULL DEFAULT 'default';

-- 3) Seed chip skins (only if each path does not already exist).
INSERT INTO product (name, description, image, path, tokens, coins, type, isRecommend, isActive)
SELECT 'Default Chip', 'Classic casino chip set', '/chips/default/chips100.png', 'default', 0, 0, 'chip', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM product WHERE type = 'chip' AND path = 'default'
);

INSERT INTO product (name, description, image, path, tokens, coins, type, isRecommend, isActive)
SELECT 'Retro Chip', 'Retro style chip set', '/chips/retro/chips100.png', 'retro', 0, 1200, 'chip', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM product WHERE type = 'chip' AND path = 'retro'
);

-- Optional: if you have another chip folder, duplicate insert above with new path.

COMMIT;
