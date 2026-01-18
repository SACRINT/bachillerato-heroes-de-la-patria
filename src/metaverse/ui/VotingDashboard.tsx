import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import './VotingDashboard.css';

interface Proposal {
    id: string;
    title: string;
    category: string;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    deadline: string;
    quorum: string;
}

interface VotingPower {
    ownTokens: string;
    delegatedToMe: string;
    totalVotingPower: string;
}

/**
 * Semana 44: Dashboard de Votación DAO
 */
export default function VotingDashboard() {
    const { isConnected, address } = useWallet();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProposals();
        if (isConnected && address) {
            fetchVotingPower();
        }
    }, [isConnected, address]);

    const fetchProposals = async () => {
        try {
            const res = await fetch('/api/governance/proposals');
            const data = await res.json();
            setProposals(data.proposals);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVotingPower = async () => {
        try {
            const res = await fetch(`/api/governance/voting-power/${address}`);
            const data = await res.json();
            setVotingPower(data);
        } catch (error) {
            console.error('Error fetching voting power:', error);
        }
    };

    const handleVote = async (proposalId: string, support: 0 | 1 | 2) => {
        // 0 = Against, 1 = For, 2 = Abstain
        console.log(`Voting ${support} on proposal ${proposalId}`);
        // En producción: llamar al Governor contract via ethers
        alert(`Voto registrado: ${support === 1 ? 'A Favor' : support === 0 ? 'En Contra' : 'Abstención'}`);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'UPGRADE': return '🔧';
            case 'FUNDING': return '💰';
            case 'EVENT': return '🎉';
            case 'POLICY': return '📜';
            case 'EMERGENCY': return '🚨';
            default: return '📋';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'status-active';
            case 'passed': return 'status-passed';
            case 'rejected': return 'status-rejected';
            case 'pending': return 'status-pending';
            default: return '';
        }
    };

    const calculateProgress = (forV: string, againstV: string, abstainV: string) => {
        const total = parseInt(forV) + parseInt(againstV) + parseInt(abstainV);
        if (total === 0) return { for: 0, against: 0, abstain: 0 };
        return {
            for: (parseInt(forV) / total) * 100,
            against: (parseInt(againstV) / total) * 100,
            abstain: (parseInt(abstainV) / total) * 100
        };
    };

    if (loading) {
        return <div className="voting-dashboard loading">Cargando propuestas...</div>;
    }

    return (
        <div className="voting-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>🗳️ Sala de Votación</h1>
                {isConnected && votingPower && (
                    <div className="voting-power-card">
                        <span className="label">Tu Poder de Voto</span>
                        <span className="value">{votingPower.totalVotingPower} HGOV</span>
                        <small>({votingPower.ownTokens} propios + {votingPower.delegatedToMe} delegados)</small>
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="filters">
                {['all', 'active', 'passed', 'rejected'].map((f) => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f as any)}
                    >
                        {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Lista de Propuestas */}
            <div className="proposals-list">
                {proposals.map((proposal) => {
                    const progress = calculateProgress(proposal.forVotes, proposal.againstVotes, proposal.abstainVotes);

                    return (
                        <div
                            key={proposal.id}
                            className="proposal-card"
                            onClick={() => setSelectedProposal(proposal)}
                        >
                            <div className="proposal-header">
                                <span className="category">{getCategoryIcon(proposal.category)} {proposal.category}</span>
                                <span className={`status ${getStatusClass(proposal.status)}`}>
                                    {proposal.status}
                                </span>
                            </div>

                            <h3>{proposal.title}</h3>

                            <div className="vote-progress">
                                <div className="bar">
                                    <div className="for" style={{ width: `${progress.for}%` }}></div>
                                    <div className="against" style={{ width: `${progress.against}%` }}></div>
                                    <div className="abstain" style={{ width: `${progress.abstain}%` }}></div>
                                </div>
                                <div className="labels">
                                    <span className="for">✓ {proposal.forVotes}</span>
                                    <span className="against">✕ {proposal.againstVotes}</span>
                                    <span className="abstain">○ {proposal.abstainVotes}</span>
                                </div>
                            </div>

                            <div className="proposal-footer">
                                <span>Quorum: {proposal.quorum}</span>
                                <span>Cierra: {new Date(proposal.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Votación */}
            {selectedProposal && (
                <div className="vote-modal-overlay" onClick={() => setSelectedProposal(null)}>
                    <div className="vote-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedProposal.title}</h2>
                        <p className="category">{getCategoryIcon(selectedProposal.category)} {selectedProposal.category}</p>

                        {isConnected ? (
                            <div className="vote-buttons">
                                <button className="vote-btn for" onClick={() => handleVote(selectedProposal.id, 1)}>
                                    ✓ A Favor
                                </button>
                                <button className="vote-btn against" onClick={() => handleVote(selectedProposal.id, 0)}>
                                    ✕ En Contra
                                </button>
                                <button className="vote-btn abstain" onClick={() => handleVote(selectedProposal.id, 2)}>
                                    ○ Abstención
                                </button>
                            </div>
                        ) : (
                            <p className="connect-prompt">Conecta tu wallet para votar</p>
                        )}

                        <button className="close-btn" onClick={() => setSelectedProposal(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
