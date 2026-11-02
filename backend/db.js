const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Desativa temporariamente o SSL para evitar conflitos com a porta de conexão
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar à base de dados do Supabase:', err.stack);
  }
  console.log('Base de dados PostgreSQL conectada com sucesso!');
  release();
});

module.exports = pool;