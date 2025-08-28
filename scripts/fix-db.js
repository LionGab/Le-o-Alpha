// Script para corrigir estrutura do banco existente
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
  try {
    console.log('🔧 Corrigindo estrutura do banco de dados...');
    
    // 1. Criar tabela tipos_medidas se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_medidas (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT,
          gravidade INTEGER DEFAULT 1,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela tipos_medidas criada/verificada');
    
    // 2. Inserir tipos de medidas padrão (apenas se não existir)
    const tiposExistentes = await pool.query('SELECT COUNT(*) FROM tipos_medidas');
    if (parseInt(tiposExistentes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO tipos_medidas (nome, descricao, gravidade) VALUES 
        ('Advertência Verbal', 'Conversa com o aluno sobre comportamento inadequado', 1),
        ('Advertência Escrita', 'Registro formal de comportamento inadequado', 2),
        ('Suspensão 1 dia', 'Afastamento temporário das atividades por 1 dia', 3),
        ('Suspensão 3 dias', 'Afastamento temporário das atividades por 3 dias', 3),
        ('Convocação dos Responsáveis', 'Reunião com pais/responsáveis', 2),
        ('Reposição de Aula', 'Aula extra para compensar ausência injustificada', 1),
        ('Trabalho Comunitário', 'Atividade de conscientização social', 2)
      `);
    }
    console.log('✅ Tipos de medidas inseridos');
    
    // 3. Criar tabela configuracoes se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
          chave VARCHAR(255) PRIMARY KEY,
          valor TEXT,
          descricao TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela configuracoes criada/verificada');
    
    // 4. Inserir configurações iniciais (apenas se não existir)
    const configExistentes = await pool.query('SELECT COUNT(*) FROM configuracoes');
    if (parseInt(configExistentes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO configuracoes (chave, valor, descricao) VALUES 
        ('escola_nome', 'Sistema Disciplinar', 'Nome da escola'),
        ('escola_endereco', '', 'Endereço da escola'),
        ('escola_telefone', '', 'Telefone da escola'),
        ('sistema_versao', '1.0.0', 'Versão do sistema'),
        ('backup_automatico', 'true', 'Ativar backup automático'),
        ('notificacoes_email', 'true', 'Enviar notificações por email')
      `);
    }
    console.log('✅ Configurações inseridas');
    
    // 5. Verificar/criar usuário admin
    const adminCheck = await pool.query('SELECT * FROM usuarios WHERE email = $1', ['admin@escola.edu.br']);
    
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO usuarios (nome, patente, email, senha, ativo)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Administrador', 'Admin', 'admin@escola.edu.br', hashedPassword, true]);
      console.log('✅ Usuário admin criado');
    } else {
      console.log('✅ Usuário admin já existe');
    }
    
    // 6. Criar índices se não existirem
    await pool.query('CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos(nome)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ocorrencias_aluno ON ocorrencias(aluno_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_frequencia_aluno_data ON frequencia(aluno_id, data)');
    console.log('✅ Índices criados');
    
    // 7. Testar consultas básicas
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM alunos) as alunos,
        (SELECT COUNT(*) FROM tipos_medidas WHERE ativo = true) as tipos_medidas,
        (SELECT COUNT(*) FROM configuracoes) as configuracoes
    `);
    
    const s = stats.rows[0];
    console.log('📊 Estatísticas do banco:');
    console.log(`  👥 Usuários ativos: ${s.usuarios}`);
    console.log(`  🎓 Alunos ativos: ${s.alunos}`);
    console.log(`  ⚖️ Tipos de medidas: ${s.tipos_medidas}`);
    console.log(`  ⚙️ Configurações: ${s.configuracoes}`);
    
    console.log('\n🎉 Banco de dados corrigido com sucesso!');
    console.log('📧 Login: admin@escola.edu.br');
    console.log('🔒 Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banco:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixDatabase();