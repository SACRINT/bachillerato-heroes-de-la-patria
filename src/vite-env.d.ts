/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_SOCKET_URL: string;
    readonly VITE_WEB3_RPC_URL: string;
    readonly VITE_CHAIN_ID: string;
    // Más variables de entorno según sea necesario
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
