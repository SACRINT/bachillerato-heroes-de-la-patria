import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import './EconomyDashboard.css';

interface EconomyStats {
    iacoinsBalance: string;
    stakedAmount: string;
    pendingRewards: string;
    nftCount: number;
    dailyEarningsCap: number;
    todayEarnings: number;
}

/**
 * Semana 31: Dashboard Económico del Usuario
 * Muestra balances, staking, rewards y límites
 */
export default function EconomyDashboard() {
    const { isConnected, address } = useWallet();
    const [stats, setStats] = useState<EconomyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && address) {
            fetchEconomyStats();
        }
    }, [isConnected, address]);

    const fetchEconomyStats = async () => {
        setLoading(true);
        try {
            // En producción: llamar a /api/web3/economy-stats/:address
            // Simulación por ahora
            await new Promise(resolve => setTimeout(resolve, 500));

            setStats({
                iacoinsBalance: '1,250.00',
                stakedAmount: '500.00',
                pendingRewards: '12.50',
                nftCount: 8,
                dailyEarningsCap: 100,
                todayEarnings: 45
            });
        } catch (error) {
            console.error('Error fetching economy stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="economy-dashboard not-connected">
                <p>Conecta tu wallet para ver tu economía</p>
            </div>
        );
    }

    if (loading) {
        return <div className="economy-dashboard loading">Cargando datos económicos...</div>;
    }

    const earningsProgress = stats ? (stats.todayEarnings / stats.dailyEarningsCap) * 100 : 0;

    return (
        <div className="economy-dashboard">
            <h2>💰 Mi Economía</h2>

            {/* Balance Principal */}
            <div className="stat-card primary">
                <div className="stat-icon">🪙</div>
                <div className="stat-content">
                    <span className="label">Balance IACoins</span>
                    <span className="value">{stats?.iacoinsBalance} IAC</span>
                </div>
            </div>

            {/* Grid de Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="label">📈 En Staking</span>
                    <span className="value">{stats?.stakedAmount} IAC</span>
                </div>

                <div className="stat-card">
                    <span className="label">🎁 Rewards Pendientes</span>
                    <span className="value highlight">{stats?.pendingRewards} IAC</span>
                    <button className="claim-btn">Reclamar</button>
                </div>

                <div className="stat-card">
                    <span className="label">🎨 NFTs Propios</span>
                    <span className="value">{stats?.nftCount}</span>
                </div>
            </div>

            {/* Límite diario de ganancias (Anti-farm) */}
            <div className="daily-cap">
                <div className="cap-header">
                    <span>Ganancias de Hoy</span>
                    <span>{stats?.todayEarnings} / {stats?.dailyEarningsCap} IAC</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(earningsProgress, 100)}%` }}
                    />
                </div>
                <p className="cap-info">
                    Límite diario para mantener una economía saludable
                </p>
            </div>

            {/* Acciones rápidas */}
            <div className="quick-actions">
                <button className="action-btn stake">📊 Ir a Staking</button>
                <button className="action-btn market">🛒 Marketplace</button>
                <button className="action-btn history">📜 Historial</button>
            </div>
        </div>
    );
}
