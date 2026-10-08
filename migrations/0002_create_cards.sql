-- Card reference data. Rows are loaded by `npm run db:seed:cards` (generated from data/cards.json),
-- so a game patch only needs a new cards.json, not a new migration.
CREATE TABLE IF NOT EXISTS cards (
  id                          TEXT PRIMARY KEY,   -- matches run files without the CARD. prefix
  name                        TEXT NOT NULL,
  description                 TEXT,               -- game markup, e.g. [gold]Block[/gold]
  description_raw             TEXT,
  upgrade_description         TEXT,               -- NULL when the upgrade doesn't change the text (see upgrade)
  upgrade                     TEXT,               -- JSON, e.g. {"cost":0} or {"damage":"+3"}; NULL = can't upgrade
  cost                        INTEGER,
  is_x_cost                   INTEGER,
  star_cost                   INTEGER,
  is_x_star_cost              INTEGER,
  type                        TEXT,               -- Attack, Skill, Power, Curse, Status, Quest
  type_key                    TEXT,
  rarity                      TEXT,
  rarity_key                  TEXT,
  target                      TEXT,
  color                       TEXT,               -- character pool: ironclad, silent, ... colorless, curse
  damage                      INTEGER,
  block                       INTEGER,
  hit_count                   INTEGER,
  cards_draw                  INTEGER,
  energy_gain                 INTEGER,
  hp_loss                     INTEGER,
  keywords                    TEXT,               -- JSON array
  tags                        TEXT,               -- JSON array
  powers_applied              TEXT,               -- JSON array
  spawns_cards                TEXT,               -- JSON array of card ids
  vars                        TEXT,               -- JSON object
  type_variants               TEXT,               -- JSON object (Mad Science)
  sources                     TEXT,               -- JSON array, for status cards added by monsters
  can_be_generated_in_combat  INTEGER,
  multiplayer_only            INTEGER,
  compendium_order            INTEGER,
  image_url                   TEXT,               -- https://cdn.seethespire.com/cards/<id>.png
  image_url_upgraded          TEXT                -- https://cdn.seethespire.com/cards/<id>_plus.png
);

CREATE INDEX IF NOT EXISTS idx_cards_color ON cards (color, rarity);
