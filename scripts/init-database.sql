-- Script de inicialização do banco de dados PostgreSQL
-- Sistema Disciplinar

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários/administradores
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    turma VARCHAR(100),
    serie VARCHAR(50),
    responsavel VARCHAR(255),
    telefone_responsavel VARCHAR(20),
    endereco TEXT,
    data_nascimento DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tipos de medidas disciplinares
CREATE TABLE IF NOT EXISTS tipos_medidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    gravidade INTEGER DEFAULT 1, -- 1=leve, 2=moderada, 3=grave
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de ocorrências disciplinares
CREATE TABLE IF NOT EXISTS ocorrencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    tipo_medida_id UUID REFERENCES tipos_medidas(id),
    usuario_id UUID REFERENCES usuarios(id),
    descricao TEXT NOT NULL,
    data_ocorrencia DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, resolvida, arquivada
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de frequência
CREATE TABLE IF NOT EXISTS frequencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    data_registro DATE NOT NULL,
    presente BOOLEAN NOT NULL,
    justificativa TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aluno_id, data_registro)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    chave VARCHAR(255) PRIMARY KEY,
    valor TEXT,
    descricao TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados iniciais

-- Usuário admin padrão (senha: admin123) - hash bcrypt gerado
INSERT INTO usuarios (nome, email, senha_hash) 
VALUES ('Administrador', 'admin@escola.edu.br', '$2a$10$rOzKqYhQQJCNQJ3xJ0mB/.2YlZQZn9aZ2wXq7vX8oHvQsH9yUeY5e')
ON CONFLICT (email) DO NOTHING;

-- Tipos de medidas disciplinares padrão
INSERT INTO tipos_medidas (nome, descricao, gravidade) VALUES 
('Advertência Verbal', 'Conversa com o aluno sobre comportamento inadequado', 1),
('Advertência Escrita', 'Registro formal de comportamento inadequado', 2),
('Suspensão 1 dia', 'Afastamento temporário das atividades por 1 dia', 3),
('Suspensão 3 dias', 'Afastamento temporário das atividades por 3 dias', 3),
('Convocação dos Responsáveis', 'Reunião com pais/responsáveis', 2),
('Reposição de Aula', 'Aula extra para compensar ausência injustificada', 1),
('Trabalho Comunitário', 'Atividade de conscientização social', 2)
ON CONFLICT DO NOTHING;

-- Configurações iniciais
INSERT INTO configuracoes (chave, valor, descricao) VALUES 
('escola_nome', 'Sistema Disciplinar', 'Nome da escola'),
('escola_endereco', '', 'Endereço da escola'),
('escola_telefone', '', 'Telefone da escola'),
('sistema_versao', '1.0.0', 'Versão do sistema'),
('backup_automatico', 'true', 'Ativar backup automático'),
('notificacoes_email', 'true', 'Enviar notificações por email')
ON CONFLICT (chave) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos(nome);
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_aluno ON ocorrencias(aluno_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data ON ocorrencias(data_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_frequencia_aluno_data ON frequencia(aluno_id, data_registro);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();