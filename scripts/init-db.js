// Script para inicializar o banco de dados
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'init-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o script SQL
    console.log('📄 Executando script SQL...');
    await pool.query(sqlContent);
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    
    // Testar algumas consultas básicas
    console.log('🔍 Testando consultas...');
    
    const usuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
    console.log(`👥 Usuários cadastrados: ${usuarios.rows[0].count}`);
    
    const tiposMedidas = await pool.query('SELECT COUNT(*) FROM tipos_medidas');
    console.log(`⚖️ Tipos de medidas cadastrados: ${tiposMedidas.rows[0].count}`);
    
    const configuracoes = await pool.query('SELECT COUNT(*) FROM configuracoes');
    console.log(`⚙️ Configurações: ${configuracoes.rows[0].count}`);
    
    console.log('\n🎉 Sistema pronto para uso!');
    console.log('📧 Login padrão: admin@escola.edu.br');
    console.log('🔒 Senha padrão: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    console.error('💡 Verifique se as variáveis de ambiente estão configuradas corretamente');
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };