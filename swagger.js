const swaggerJsdoc = require('swagger-jsdoc');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pokédex API',
      version: '1.0.0',
      description: 'Microservicio de Pokémon (PostgreSQL)',
    },
    components: {
      schemas: {
        Pokemon: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 25 },
            name: { type: 'string', example: 'pikachu' },
            height: { type: 'integer', example: 4 },
            weight: { type: 'integer', example: 60 },
            image: { type: 'string', nullable: true },
            types: { type: 'array', items: { type: 'string' }, example: ['electric'] },
            moves: { type: 'array', items: { type: 'string' } },
            stats: {
              type: 'object',
              properties: {
                hp: { type: 'integer' }, attack: { type: 'integer' },
                defense: { type: 'integer' }, specialAttack: { type: 'integer' },
                specialDefense: { type: 'integer' }, speed: { type: 'integer' },
              },
            },
            hasGenderDifference: { type: 'boolean' },
            imageFemale: { type: 'string', nullable: true },
            hasAlternateForms: { type: 'boolean' },
            forms: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, image: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./index.js'],
});