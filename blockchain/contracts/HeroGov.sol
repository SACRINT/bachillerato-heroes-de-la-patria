// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HeroGov
 * @dev Token de gobernanza para la DAO educativa BGE Héroes de la Patria.
 * Implementa ERC20Votes para delegación y votación on-chain.
 */
contract HeroGov is ERC20, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Límites anti-ballena
    uint256 public maxTokensPerWallet = 100000 * 10**18; // 100k tokens max
    bool public transfersEnabled = false;

    // Eventos
    event MaxWalletUpdated(uint256 newMax);
    event TransfersToggled(bool enabled);

    constructor() ERC20("HeroGov", "HGOV") ERC20Permit("HeroGov") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mintear tokens de gobernanza a una cuenta
     * Usado para distribuir a estudiantes basándose en participación
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(balanceOf(to) + amount <= maxTokensPerWallet, "Exceeds max wallet");
        _mint(to, amount);
    }

    /**
     * @dev Distribución inicial masiva (Airdrop)
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(recipients.length == amounts.length, "Arrays mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(balanceOf(recipients[i]) + amounts[i] <= maxTokensPerWallet, "Exceeds max wallet");
            _mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Habilitar/deshabilitar transferencias
     * Inicialmente deshabilitado para distribución controlada
     */
    function setTransfersEnabled(bool _enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersEnabled = _enabled;
        emit TransfersToggled(_enabled);
    }

    /**
     * @dev Actualizar límite máximo por wallet
     */
    function setMaxWallet(uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTokensPerWallet = _max;
        emit MaxWalletUpdated(_max);
    }

    // ============ Overrides Requeridos ============

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        // Permitir mint (from == 0) y burn (to == 0) siempre
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
            require(balanceOf(to) + value <= maxTokensPerWallet, "Exceeds max wallet");
        }
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    // Para que el usuario auto-delegue al recibir tokens
    function _afterTokenTransfer(address from, address to, uint256 amount) internal {
        // Auto-delegar si el receptor no tiene delegado
        if (delegates(to) == address(0) && to != address(0)) {
            _delegate(to, to);
        }
    }
}
