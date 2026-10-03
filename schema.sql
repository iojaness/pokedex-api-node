DROP TABLE IF EXISTS pokemon_forms, pokemon_moves, pokemon_types,
                     pokemon_stats, types, pokemon CASCADE;

CREATE TABLE pokemon (
  id                    INT PRIMARY KEY,           -- número de Pokédex
  name                  VARCHAR(50) UNIQUE NOT NULL,
  height                INT,                        -- decímetros
  weight                INT,                        -- hectogramos
  image                 TEXT,
  has_gender_difference BOOLEAN NOT NULL DEFAULT FALSE,
  image_female          TEXT,                       -- solo si hay diferencia sexual
  has_alternate_forms   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE types (name VARCHAR(20) PRIMARY KEY);

CREATE TABLE pokemon_types (
  pokemon_id INT REFERENCES pokemon(id) ON DELETE CASCADE,
  type_name  VARCHAR(20) REFERENCES types(name),
  slot       INT NOT NULL,
  PRIMARY KEY (pokemon_id, slot)
);

CREATE TABLE pokemon_moves (
  pokemon_id INT REFERENCES pokemon(id) ON DELETE CASCADE,
  move_name  VARCHAR(60),
  PRIMARY KEY (pokemon_id, move_name)
);

CREATE TABLE pokemon_stats (
  pokemon_id      INT PRIMARY KEY REFERENCES pokemon(id) ON DELETE CASCADE,
  hp              INT NOT NULL,
  attack          INT NOT NULL,
  defense         INT NOT NULL,
  special_attack  INT NOT NULL,
  special_defense INT NOT NULL,
  speed           INT NOT NULL
);

CREATE TABLE pokemon_forms (
  id         SERIAL PRIMARY KEY,
  pokemon_id INT REFERENCES pokemon(id) ON DELETE CASCADE,
  form_name  VARCHAR(80) NOT NULL,
  image      TEXT NOT NULL
);