require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Charizard, Pikachu, Eevee, Gengar, Snorlax, Mewtwo, Gyarados, Garchomp, Lucario, Greninja
const IDS = [6, 25, 133, 94, 143, 150, 130, 445, 448, 658];

const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Error ${r.status} en ${url}`);
  return r.json();
};
const artwork = (d) => d.sprites?.other?.['official-artwork']?.front_default ?? null;

async function seed() {
  const c = await pool.connect();
  try {
    await c.query(fs.readFileSync('schema.sql', 'utf8'));

    for (const id of IDS) {
      const p = await get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const sp = await get(p.species.url);

      // Imagen de hembra (solo si la especie tiene diferencia sexual)
      const imageFemale = sp.has_gender_differences
        ? (p.sprites?.other?.['official-artwork']?.front_female ?? p.sprites?.front_female ?? null)
        : null;

      // Formas alternas (megaevoluciones, etc.) con su imagen
      const forms = [];
      for (const v of sp.varieties.filter((v) => !v.is_default)) {
        const fp = await get(v.pokemon.url);
        const img = artwork(fp);
        if (img) forms.push({ name: fp.name, image: img });
      }

      await c.query('BEGIN');
      await c.query(
        `INSERT INTO pokemon (id,name,height,weight,image,has_gender_difference,image_female,has_alternate_forms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [p.id, p.name, p.height, p.weight, artwork(p),
         sp.has_gender_differences, imageFemale, forms.length > 0]
      );

      for (const t of p.types) {
        await c.query('INSERT INTO types(name) VALUES ($1) ON CONFLICT DO NOTHING', [t.type.name]);
        await c.query('INSERT INTO pokemon_types VALUES ($1,$2,$3)', [p.id, t.type.name, t.slot]);
      }

      for (const m of p.moves.slice(0, 20)) {
        await c.query('INSERT INTO pokemon_moves VALUES ($1,$2)', [p.id, m.move.name]);
      }

      const s = Object.fromEntries(p.stats.map((x) => [x.stat.name, x.base_stat]));
      await c.query('INSERT INTO pokemon_stats VALUES ($1,$2,$3,$4,$5,$6,$7)', [
        p.id, s.hp, s.attack, s.defense, s['special-attack'], s['special-defense'], s.speed,
      ]);

      for (const f of forms) {
        await c.query('INSERT INTO pokemon_forms(pokemon_id,form_name,image) VALUES ($1,$2,$3)',
          [p.id, f.name, f.image]);
      }
      await c.query('COMMIT');
      console.log(`✔ ${p.name} (${forms.length} formas, diferencia sexual: ${sp.has_gender_differences})`);
    }
  } catch (e) {
    await c.query('ROLLBACK');
    console.error(e);
  } finally {
    c.release();
    await pool.end();
  }
}
seed();