import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipado básico para window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

interface WalletContextType {
    address: string | null;
    balance: string | null;
    chainId: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar si ya está conectado al cargar
    useEffect(() => {
        checkIfWalletIsConnected();

        // Listeners de cambio de cuenta/red
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            setAddress(accounts[0]);
        }
    };

    const handleChainChanged = (_chainId: string) => {
        // Recargar la página es la recomendación estándar de MetaMask
        window.location.reload();
    };

    const checkIfWalletIsConnected = async () => {
        if (!window.ethereum) return;

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAddress(accounts[0]);
                // Aquí podríamos pedir el balance también
            }
        } catch (err) {
            console.error(err);
        }
    };

    const connectWallet = async () => {
        setIsConnecting(true);
        setError(null);

        if (!window.ethereum) {
            setError("No se detectó billetera (MetaMask).");
            setIsConnecting(false);
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAddress(accounts[0]);

            const chain = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(chain);

        } catch (err: any) {
            setError(err.message || "Error al conectar");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAddress(null);
        setBalance(null);
        setChainId(null);
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                balance,
                chainId,
                isConnected: !!address,
                isConnecting,
                connectWallet,
                disconnectWallet,
                error
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
