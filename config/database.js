// Configuração do banco de dados
const { Pool } = require('pg');
const Redis = require('ioredis');

// Configuração PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuração Redis (Upstash)
const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Função para testar conexão PostgreSQL
async function testPostgreConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro PostgreSQL:', err.message);
    return false;
  }
}

// Função para testar conexão Redis
async function testRedisConnection() {
  try {
    await redis.ping();
    console.log('✅ Redis conectado');
    return true;
  } catch (err) {
    console.error('❌ Erro Redis:', err.message);
    return false;
  }
}

// Função para executar queries no PostgreSQL
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Erro na query:', { text, error: err.message });
    throw err;
  }
}

// Função para cache no Redis
async function cacheGet(key) {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error('Erro cache get:', err.message);
    return null;
  }
}

async function cacheSet(key, value, ttl = 3600) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Erro cache set:', err.message);
    return false;
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error('Erro cache del:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  redis,
  query,
  cacheGet,
  cacheSet,
  cacheDel,
  testPostgreConnection,
  testRedisConnection
};