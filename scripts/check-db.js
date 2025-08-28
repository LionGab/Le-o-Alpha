// Script para verificar e corrigir estrutura do banco
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estrutura do banco...');
    
    // Verificar se tabela usuarios existe
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Tabela usuarios não existe');
      return;
    }
    
    // Verificar colunas da tabela usuarios
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas da tabela usuarios:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Verificar se coluna senha_hash existe
    const senhaHashExists = columnsResult.rows.some(col => col.column_name === 'senha_hash');
    
    if (!senhaHashExists) {
      console.log('❌ Coluna senha_hash não existe, verificando alternativas...');
      
      // Procurar colunas similares
      const passwordColumns = columnsResult.rows.filter(col => 
        col.column_name.includes('password') || 
        col.column_name.includes('senha') ||
        col.column_name.includes('hash')
      );
      
      console.log('🔑 Colunas relacionadas a senha encontradas:');
      passwordColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      if (passwordColumns.length > 0) {
        console.log('💡 Sugestão: Renomear ou adicionar coluna senha_hash');
      }
    } else {
      console.log('✅ Coluna senha_hash existe');
    }
    
    // Verificar outras tabelas importantes
    const importantTables = ['alunos', 'ocorrencias', 'tipos_medidas', 'frequencia'];
    
    for (const tableName of importantTables) {
      const tableExists = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      
      if (tableExists.rows.length > 0) {
        console.log(`✅ Tabela ${tableName} existe`);
      } else {
        console.log(`❌ Tabela ${tableName} não existe`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();