// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TokenBridge
 * @dev Bridge para transferir tokens entre cadenas (Testnet <-> Mainnet).
 * Implementa un modelo de lock-and-mint / burn-and-unlock.
 */
contract TokenBridge is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable token;
    
    // Identificador de cadena
    uint256 public immutable chainId;
    
    // Nonce para prevenir replay attacks
    mapping(address => uint256) public nonces;
    
    // Transacciones procesadas
    mapping(bytes32 => bool) public processedTransactions;
    
    // Límites
    uint256 public minBridgeAmount = 10 * 10**18;   // 10 tokens mínimo
    uint256 public maxBridgeAmount = 10000 * 10**18; // 10,000 tokens máximo
    uint256 public dailyLimit = 100000 * 10**18;    // 100,000 tokens diarios
    
    // Tracking de límite diario
    mapping(uint256 => uint256) public dailyBridged; // day => amount
    
    // Eventos
    event BridgeInitiated(
        address indexed sender,
        uint256 amount,
        uint256 targetChainId,
        uint256 nonce,
        bytes32 txHash
    );
    
    event BridgeCompleted(
        address indexed recipient,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 sourceTxHash
    );
    
    event BridgeLimitsUpdated(uint256 min, uint256 max, uint256 daily);

    constructor(address _token, uint256 _chainId) {
        token = IERC20(_token);
        chainId = _chainId;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Iniciar bridge (lock tokens en esta cadena)
     * @param amount Cantidad de tokens a transferir
     * @param targetChainId ID de la cadena destino
     */
    function initiateBridge(uint256 amount, uint256 targetChainId) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (bytes32)
    {
        require(amount >= minBridgeAmount, "Amount too low");
        require(amount <= maxBridgeAmount, "Amount too high");
        require(targetChainId != chainId, "Same chain");
        
        // Verificar límite diario
        uint256 today = block.timestamp / 1 days;
        require(dailyBridged[today] + amount <= dailyLimit, "Daily limit exceeded");
        dailyBridged[today] += amount;
        
        // Lock tokens
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        // Generar tx hash único
        uint256 nonce = nonces[msg.sender]++;
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            chainId,
            targetChainId,
            nonce,
            block.timestamp
        ));
        
        emit BridgeInitiated(msg.sender, amount, targetChainId, nonce, txHash);
        
        return txHash;
    }

    /**
     * @dev Completar bridge (unlock/mint tokens basado en validación)
     * @param recipient Destinatario de los tokens
     * @param amount Cantidad
     * @param sourceChainId Cadena de origen
     * @param sourceTxHash Hash de la transacción original
     * @param signature Firma del validador
     */
    function completeBridge(
        address recipient,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 sourceTxHash,
        bytes memory signature
    ) external whenNotPaused nonReentrant {
        // Verificar que no se ha procesado
        require(!processedTransactions[sourceTxHash], "Already processed");
        
        // Verificar firma del validador
        bytes32 messageHash = keccak256(abi.encodePacked(
            recipient,
            amount,
            sourceChainId,
            chainId,
            sourceTxHash
        ));
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        
        require(hasRole(VALIDATOR_ROLE, signer), "Invalid validator signature");
        
        // Marcar como procesada
        processedTransactions[sourceTxHash] = true;
        
        // Unlock tokens
        token.safeTransfer(recipient, amount);
        
        emit BridgeCompleted(recipient, amount, sourceChainId, sourceTxHash);
    }

    /**
     * @dev Verificar si una transacción ya fue procesada
     */
    function isProcessed(bytes32 txHash) external view returns (bool) {
        return processedTransactions[txHash];
    }

    /**
     * @dev Obtener estadísticas del bridge
     */
    function getBridgeStats() external view returns (
        uint256 totalLocked,
        uint256 todayBridged,
        uint256 remainingDaily
    ) {
        totalLocked = token.balanceOf(address(this));
        uint256 today = block.timestamp / 1 days;
        todayBridged = dailyBridged[today];
        remainingDaily = dailyLimit > todayBridged ? dailyLimit - todayBridged : 0;
    }

    // ============ Admin ============

    function setLimits(uint256 _min, uint256 _max, uint256 _daily) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_min < _max, "Invalid range");
        minBridgeAmount = _min;
        maxBridgeAmount = _max;
        dailyLimit = _daily;
        
        emit BridgeLimitsUpdated(_min, _max, _daily);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    /**
     * @dev Recuperar tokens atrapados (emergencia)
     */
    function emergencyWithdraw(address to, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(paused(), "Must be paused");
        token.safeTransfer(to, amount);
    }
}
