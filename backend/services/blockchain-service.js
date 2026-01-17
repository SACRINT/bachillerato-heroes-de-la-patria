const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contracts = {};
        this.isConnected = false;

        this.initialize();
    }

    async initialize() {
        try {
            // Configurar Provider (Localhost por defecto, o RPC URL)
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // Verificar conexión
            const network = await this.provider.getNetwork();
            console.log(`🔗 Blockchain conectada: Chain ID ${network.chainId}`);

            // Configurar Wallet (Signer) si hay Private Key
            if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
                console.log(`👛 Wallet configurada: ${this.wallet.address}`);
            }

            this.isConnected = true;

            // Cargar contratos si existen las direcciones
            this.loadContracts();

        } catch (error) {
            console.warn('⚠️ No se pudo conectar a la Blockchain (Is Hardhat running?):', error.message);
        }
    }

    loadContracts() {
        // Direcciones de contratos (Deberían venir de ENV)
        const addresses = {
            IACoin: process.env.CONTRACT_IACOIN_ADDRESS,
            StudentIdentity: process.env.CONTRACT_SBT_ADDRESS,
            AcademyCredential: process.env.CONTRACT_ACADEMY_ADDRESS
        };

        // ABIs (Placeholder - en producción se cargan los JSON reales)
        // Por simplicidad, aquí definimos las interfaces mínimas que necesitamos usar
        const abis = {
            IACoin: [
                "function balanceOf(address owner) view returns (uint256)",
                "function mint(address to, uint256 amount) public",
                "function transfer(address to, uint256 amount) returns (bool)"
            ],
            StudentIdentity: [
                "function safeMint(address to, string memory uri) public",
                "function ownerOf(uint256 tokenId) view returns (address)",
                "function studentToTokenId(address student) view returns (uint256)",
                "event IdentityIssued(address indexed student, uint256 tokenId)"
            ],
            AcademyCredential: [
                "function issueCredential(address to, string memory uri) public returns (uint256)",
                "function balanceOf(address owner) view returns (uint256)",
                "event CredentialIssued(address indexed student, uint256 tokenId, string uri)"
            ]
        };

        // Instanciar contratos
        for (const [name, address] of Object.entries(addresses)) {
            if (address && this.isConnected) {
                this.contracts[name] = new ethers.Contract(
                    address,
                    abis[name],
                    this.wallet || this.provider
                );
                console.log(`📜 Contrato cargado: ${name} en ${address}`);
            }
        }
    }

    /**
     * Escuchar eventos de la blockchain
     */
    setupEventListeners() {
        if (!this.contracts.StudentIdentity) return;

        this.contracts.StudentIdentity.on("IdentityIssued", (student, tokenId) => {
            console.log(`🎉 Nueva Identidad emitida! Student: ${student}, TokenID: ${tokenId}`);
            // Aquí llamaríamos a un DAO para actualizar la DB:
            // database.updateUserWaitletStatus(student, tokenId);
        });
    }

    /**
     * Emitir una credencial académica
     */
    async issueDiploma(studentAddress, ipfsUri) {
        if (!this.contracts.AcademyCredential || !this.wallet) {
            throw new Error("Contrato AcademyCredential no configurado o Wallet sin permisos");
        }

        console.log(`🎓 Emitiendo diploma para ${studentAddress}...`);
        const tx = await this.contracts.AcademyCredential.issueCredential(studentAddress, ipfsUri);
        await tx.wait();
        console.log(`✅ Diploma emitido. Hash: ${tx.hash}`);
        return tx.hash;
    }
}

// Singleton
module.exports = new BlockchainService();
