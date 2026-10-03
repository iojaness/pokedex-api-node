require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const pool = require('./db');
const swaggerSpec = require('./swagger');

const app = express();
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const POKEMON_SQL = `
  SELECT p.id, p.name, p.height, p.weight, p.image,
         p.has_gender_difference AS "hasGenderDifference",
         p.image_female          AS "imageFemale",
         p.has_alternate_forms   AS "hasAlternateForms",
         json_build_object(
           'hp', s.hp, 'attack', s.attack, 'defense', s.defense,
           'specialAttack', s.special_attack, 'specialDefense', s.special_defense,
           'speed', s.speed) AS stats,
         COALESCE((SELECT json_agg(pt.type_name ORDER BY pt.slot)
                   FROM pokemon_types pt WHERE pt.pokemon_id = p.id), '[]') AS types,
         COALESCE((SELECT json_agg(pm.move_name ORDER BY pm.move_name)
                   FROM pokemon_moves pm WHERE pm.pokemon_id = p.id), '[]') AS moves,
         COALESCE((SELECT json_agg(json_build_object('name', f.form_name, 'image', f.image))
                   FROM pokemon_forms f WHERE f.pokemon_id = p.id), '[]') AS forms
  FROM pokemon p
  JOIN pokemon_stats s ON s.pokemon_id = p.id
`;

/**
 * @openapi
 * /api/pokemon:
 *   get:
 *     summary: Lista los Pokémon almacenados
 *     tags: [Pokémon]
 *     responses:
 *       200:
 *         description: Lista de Pokémon
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pokemon'
 */
app.get('/api/pokemon', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${POKEMON_SQL} ORDER BY p.id`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

/**
 * @openapi
 * /api/pokemon/{query}:
 *   get:
 *     summary: Busca un Pokémon por nombre o número de Pokédex
 *     tags: [Pokémon]
 *     parameters:
 *       - in: path
 *         name: query
 *         required: true
 *         schema: { type: string }
 *         example: pikachu
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: Pokémon no encontrado
 */
app.get('/api/pokemon/:query', async (req, res) => {
  const q = req.params.query.toLowerCase().trim();
  try {
    const isId = /^\d+$/.test(q);
    const { rows } = await pool.query(
      `${POKEMON_SQL} WHERE ${isId ? 'p.id = $1' : 'p.name = $1'}`,
      [isId ? parseInt(q, 10) : q]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pokemon no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

app.get('/', (_req, res) => res.redirect('/api-docs'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Pokédex API en puerto ${PORT}`));