import React from 'react';
import { useWallet } from '../context/WalletContext';
import './WalletInterface.css';

/**
 * Semana 18: Interfaz de Usuario para Wallet
 */
export default function WalletInterface() {
    const { isConnected, address, connectWallet, isConnecting, disconnectWallet } = useWallet();

    // Formatear dirección (0x1234...5678)
    const shortenAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="wallet-interface">
            {!isConnected ? (
                <button
                    className="btn-connect"
                    onClick={connectWallet}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Conectando...' : '🔗 Conectar Wallet'}
                </button>
            ) : (
                <div className="wallet-status">
                    <div className="status-indicator online"></div>
                    <span className="wallet-address">{shortenAddress(address!)}</span>
                    <button className="btn-disconnect" onClick={disconnectWallet} title="Desconectar">
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
