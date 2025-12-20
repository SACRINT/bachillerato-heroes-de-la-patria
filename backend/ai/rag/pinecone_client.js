/**
 * @file pinecone_client.js
 * @description Wrapper singleton para la conexión a Pinecone Vector DB.
 */

const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeInstance = null;

/**
 * Inicializa y devuelve el cliente de Pinecone.
 * @returns {Promise<Pinecone>} Cliente autenticado
 */
async function getPineconeClient() {
    if (!pineconeInstance) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY no definida en variables de entorno');
        }

        pineconeInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
    }
    return pineconeInstance;
}

/**
 * Obtiene el índice configurado.
 * @returns {Promise<any>} Objeto Index
 */
async function getIndex() {
    const client = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || 'heroes-knowledge-base';
    return client.index(indexName);
}

module.exports = { getPineconeClient, getIndex };
