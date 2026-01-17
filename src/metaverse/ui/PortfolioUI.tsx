import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import './PortfolioUI.css';

interface Asset {
    id: string;
    name: string;
    type: 'NFT' | 'SBT' | 'Token';
    balance?: string;
    image?: string;
}

export default function PortfolioUI() {
    const { isConnected, address, balance } = useWallet();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            fetchAssets();
        }
    }, [isConnected, address]);

    const fetchAssets = async () => {
        setLoading(true);
        // Simulación de llamada a API (The Graph / Backend)
        // En el futuro: await fetch(`/api/web3/assets/${address}`)
        setTimeout(() => {
            setAssets([
                { id: '1', name: 'Identity SBT', type: 'SBT', image: '/assets/badges/identity.png' },
                { id: '2', name: 'Frontend Master Diploma', type: 'NFT', image: '/api/diploma/preview?name=Estudiante&course=Frontend' },
                { id: '3', name: 'IACoins', type: 'Token', balance: balance || '0' }
            ]);
            setLoading(false);
        }, 1000);
    };

    if (!isConnected) return <div className="portfolio-empty">Conecta tu wallet para ver tus activos.</div>;

    return (
        <div className="portfolio-container">
            <h2>🎒 Mis Activos Digitales</h2>

            <div className="portfolio-balance">
                <span className="label">Balance Total:</span>
                <span className="value">{balance || '0.00'} ETH</span>
            </div>

            <div className="assets-grid">
                {loading ? (
                    <div className="loading">Cargando activos...</div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.id} className="asset-card">
                            <div className="asset-image">
                                {asset.image ? (
                                    <img src={asset.image} alt={asset.name} />
                                ) : (
                                    <div className="placeholder-img">{asset.type}</div>
                                )}
                            </div>
                            <div className="asset-info">
                                <h3>{asset.name}</h3>
                                <span className={`tag ${asset.type.toLowerCase()}`}>{asset.type}</span>
                                {asset.balance && <div className="token-balance">{asset.balance} IAC</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
