const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain-service');

/**
 * Semana 42-43: API de Gobernanza DAO
 * Endpoints para propuestas, votaciones y tesorería
 */

// ============ PROPUESTAS ============

/**
 * @route GET /api/governance/proposals
 * @desc Listar todas las propuestas
 */
router.get('/proposals', async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;

        // En producción: usar The Graph para indexar eventos ProposalCreated
        const mockProposals = [
            {
                id: '1',
                title: 'Agregar nuevo edificio de Ciencias al Metaverso',
                category: 'UPGRADE',
                proposer: '0x1234...5678',
                status: 'Active',
                forVotes: '15000',
                againstVotes: '3000',
                abstainVotes: '500',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                quorum: '10000',
                ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
            },
            {
                id: '2',
                title: 'Financiar evento de graduación virtual 2026',
                category: 'FUNDING',
                proposer: '0xabcd...ef01',
                status: 'Pending',
                forVotes: '0',
                againstVotes: '0',
                abstainVotes: '0',
                deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                quorum: '10000',
                ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
            }
        ];

        // Filtrar por status si se especifica
        let filtered = mockProposals;
        if (status) {
            filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
        }
        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        res.json({
            proposals: filtered,
            total: filtered.length,
            page: parseInt(page),
            totalPages: 1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/governance/proposals/:id
 * @desc Detalle de una propuesta
 */
router.get('/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // En producción: llamar a Governor.proposals(id)
        const proposal = {
            id,
            title: 'Agregar nuevo edificio de Ciencias al Metaverso',
            description: 'Esta propuesta busca financiar la construcción de un edificio interactivo de Ciencias con laboratorios virtuales de Química, Física y Biología.',
            category: 'UPGRADE',
            proposer: '0x1234567890abcdef1234567890abcdef12345678',
            status: 'Active',
            forVotes: '15000',
            againstVotes: '3000',
            abstainVotes: '500',
            startBlock: 12345678,
            endBlock: 12400000,
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            quorum: '10000',
            quorumReached: true,
            ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
            actions: [
                {
                    target: '0xTreasury...',
                    value: '50000000000000000000000', // 50,000 tokens
                    signature: 'transfer(address,uint256)',
                    calldata: '0x...'
                }
            ]
        };

        res.json(proposal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/governance/votes/:address
 * @desc Historial de votos de un usuario
 */
router.get('/votes/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const votes = [
            { proposalId: '1', vote: 'for', weight: '500', timestamp: new Date().toISOString() },
            { proposalId: '2', vote: 'abstain', weight: '500', timestamp: new Date().toISOString() }
        ];

        res.json({ address, votes, totalVotes: votes.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/governance/voting-power/:address
 * @desc Poder de voto de un usuario (incluye delegaciones)
 */
router.get('/voting-power/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // En producción: llamar a token.getVotes(address)
        const power = {
            ownTokens: '500',
            delegatedToMe: '1200',
            totalVotingPower: '1700',
            delegatedTo: null, // o address del delegado si delegó
            isDelegating: false
        };

        res.json(power);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ DELEGACIÓN ============

/**
 * @route GET /api/governance/delegates
 * @desc Listar delegados activos
 */
router.get('/delegates', async (req, res) => {
    try {
        const delegates = [
            {
                address: '0x1234...5678',
                name: 'María García',
                votingPower: '25000',
                delegators: 45,
                participationRate: 95,
                bio: 'Representante del Consejo Estudiantil',
                avatar: '/avatars/delegate1.png'
            },
            {
                address: '0xabcd...ef01',
                name: 'Carlos López',
                votingPower: '18000',
                delegators: 32,
                participationRate: 88,
                bio: 'Líder de la comunidad tech',
                avatar: '/avatars/delegate2.png'
            }
        ];

        res.json(delegates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ TESORERÍA ============

/**
 * @route GET /api/governance/treasury
 * @desc Estado de la tesorería
 */
router.get('/treasury', async (req, res) => {
    try {
        const treasury = {
            address: '0xTreasuryMultisig...',
            balances: [
                { token: 'IACoin', symbol: 'IAC', balance: '500000', usdValue: '50000' },
                { token: 'HeroGov', symbol: 'HGOV', balance: '100000', usdValue: '10000' }
            ],
            totalValueUSD: '60000',
            signers: [
                '0xSigner1...', '0xSigner2...', '0xSigner3...'
            ],
            requiredSignatures: 2,
            pendingTransactions: 1
        };

        res.json(treasury);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/governance/treasury/transactions
 * @desc Historial de transacciones de la tesorería
 */
router.get('/treasury/transactions', async (req, res) => {
    try {
        const transactions = [
            {
                id: 'tx1',
                type: 'OUTGOING',
                proposalId: '5',
                amount: '10000',
                token: 'IAC',
                recipient: '0xEventBudget...',
                description: 'Presupuesto evento de bienvenida',
                status: 'EXECUTED',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ESTADÍSTICAS ============

/**
 * @route GET /api/governance/stats
 * @desc Estadísticas de la DAO
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalProposals: 24,
            activeProposals: 2,
            passedProposals: 18,
            rejectedProposals: 4,
            averageParticipation: 42.5, // %
            totalVoters: 856,
            totalDelegates: 15,
            treasuryValueUSD: 60000,
            tokenHolders: 1250,
            quorumPercentage: 10
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
