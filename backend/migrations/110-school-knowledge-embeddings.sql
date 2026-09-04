-- Migration 110: pgvector extension & school_knowledge_embeddings
-- Fase 6 - Backend Inteligente: Objetivo 2 & 3
-- Corpus de conocimiento institucional para búsqueda semántica y tutor escolar

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de embeddings vectoriales
CREATE TABLE IF NOT EXISTS school_knowledge_embeddings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    category VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_knowledge_tenant ON school_knowledge_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON school_knowledge_embeddings(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON school_knowledge_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
