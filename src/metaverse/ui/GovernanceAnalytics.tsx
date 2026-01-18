import React, { useState, useEffect } from 'react';
import './GovernanceAnalytics.css';

interface DAOStats {
    totalProposals: number;
    activeProposals: number;
    passedProposals: number;
    rejectedProposals: number;
    averageParticipation: number;
    totalVoters: number;
    totalDelegates: number;
    treasuryValueUSD: number;
    tokenHolders: number;
}

interface ParticipationData {
    date: string;
    participation: number;
    proposals: number;
}

/**
 * Semana 48: Dashboard de Analytics de Gobernanza
 */
export default function GovernanceAnalytics() {
    const [stats, setStats] = useState<DAOStats | null>(null);
    const [participationHistory, setParticipationHistory] = useState<ParticipationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch('/api/governance/stats'),
                // Simulamos historial
                Promise.resolve({
                    json: () => Promise.resolve(generateMockHistory())
                })
            ]);

            const statsData = await statsRes.json();
            const historyData = await historyRes.json();

            setStats(statsData);
            setParticipationHistory(historyData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateMockHistory = (): ParticipationData[] => {
        return Array.from({ length: 12 }, (_, i) => ({
            date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'short' }),
            participation: 30 + Math.random() * 40,
            proposals: Math.floor(1 + Math.random() * 5)
        }));
    };

    if (loading) {
        return <div className="governance-analytics loading">Cargando analytics...</div>;
    }

    const healthScore = stats ?
        ((stats.averageParticipation / 100) * 40 +
            (stats.passedProposals / Math.max(stats.totalProposals, 1)) * 30 +
            (stats.totalDelegates / Math.max(stats.tokenHolders, 1) * 1000) * 30) : 0;

    return (
        <div className="governance-analytics">
            <h1>📊 Estado de la DAO</h1>

            {/* Health Score */}
            <div className="health-widget">
                <div className="health-circle" style={{
                    '--health': `${Math.min(healthScore, 100)}%`
                } as React.CSSProperties}>
                    <span className="score">{Math.round(healthScore)}</span>
                    <span className="label">Salud</span>
                </div>
                <div className="health-info">
                    <h3>Índice de Salud de la DAO</h3>
                    <p>Basado en participación, aprobaciones y delegación activa</p>
                    <div className="health-status">
                        {healthScore >= 70 ? '🟢 Excelente' :
                            healthScore >= 50 ? '🟡 Buena' :
                                healthScore >= 30 ? '🟠 Regular' : '🔴 Crítica'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="icon">📋</span>
                    <span className="value">{stats?.totalProposals}</span>
                    <span className="label">Total Propuestas</span>
                </div>
                <div className="stat-card active">
                    <span className="icon">🔥</span>
                    <span className="value">{stats?.activeProposals}</span>
                    <span className="label">Activas</span>
                </div>
                <div className="stat-card passed">
                    <span className="icon">✅</span>
                    <span className="value">{stats?.passedProposals}</span>
                    <span className="label">Aprobadas</span>
                </div>
                <div className="stat-card rejected">
                    <span className="icon">❌</span>
                    <span className="value">{stats?.rejectedProposals}</span>
                    <span className="label">Rechazadas</span>
                </div>
            </div>

            {/* Participation Chart (Simplified Bar Chart) */}
            <div className="chart-section">
                <h2>Participación Electoral (Últimos 12 meses)</h2>
                <div className="bar-chart">
                    {participationHistory.map((data, i) => (
                        <div key={i} className="bar-wrapper">
                            <div
                                className="bar"
                                style={{ height: `${data.participation}%` }}
                                title={`${data.participation.toFixed(1)}%`}
                            >
                                <span className="bar-value">{data.participation.toFixed(0)}%</span>
                            </div>
                            <span className="bar-label">{data.date}</span>
                        </div>
                    ))}
                </div>
                <div className="chart-legend">
                    <span>Promedio: {stats?.averageParticipation.toFixed(1)}%</span>
                    <span>Meta: 50%</span>
                </div>
            </div>

            {/* Treasury Overview */}
            <div className="treasury-section">
                <h2>💰 Tesorería</h2>
                <div className="treasury-value">
                    ${stats?.treasuryValueUSD.toLocaleString()} USD
                </div>
                <div className="treasury-stats">
                    <div className="stat">
                        <span className="label">Holders</span>
                        <span className="value">{stats?.tokenHolders}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Votantes Activos</span>
                        <span className="value">{stats?.totalVoters}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Delegados</span>
                        <span className="value">{stats?.totalDelegates}</span>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {stats && stats.averageParticipation < 30 && (
                <div className="alert warning">
                    ⚠️ La participación está por debajo del 30%. Considera incentivar la votación.
                </div>
            )}
        </div>
    );
}
