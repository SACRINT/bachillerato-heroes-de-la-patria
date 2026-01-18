// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StudentCouncilRoles
 * @dev NFTs de cargo para el Consejo Estudiantil.
 * Cada NFT representa un cargo oficial y otorga permisos especiales.
 * Los NFTs son intransferibles (Soulbound-like) y tienen un período de validez.
 */
contract StudentCouncilRoles is ERC721, ERC721Enumerable, AccessControl, Pausable {
    bytes32 public constant ELECTION_ROLE = keccak256("ELECTION_ROLE");

    // Tipos de cargo
    enum Role { PRESIDENT, VICE_PRESIDENT, TREASURER, SECRETARY, VOCAL }

    struct CouncilPosition {
        Role role;
        uint256 electedAt;
        uint256 termEnd;
        bool isActive;
        string ipfsMetadata; // Foto, bio del elegido
    }

    // Mapeo de tokenId a posición
    mapping(uint256 => CouncilPosition) public positions;
    
    // Mapeo de rol a tokenId actual (solo 1 por rol activo)
    mapping(Role => uint256) public activeRoleToken;
    
    uint256 public nextTokenId = 1;
    uint256 public termDuration = 180 days; // ~6 meses

    // Eventos
    event Elected(address indexed member, Role role, uint256 tokenId, uint256 termEnd);
    event TermEnded(uint256 indexed tokenId, Role role);
    event Impeached(uint256 indexed tokenId, Role role, string reason);

    constructor() ERC721("HeroesCouncilRole", "HCRL") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_ROLE, msg.sender);
    }

    /**
     * @dev Elegir un nuevo miembro del consejo
     * @param member Dirección del miembro electo
     * @param role Cargo asignado
     * @param metadata IPFS hash con info del elegido
     */
    function elect(
        address member,
        Role role,
        string memory metadata
    ) external onlyRole(ELECTION_ROLE) returns (uint256) {
        // Revocar el cargo anterior si existe
        uint256 currentToken = activeRoleToken[role];
        if (currentToken != 0 && positions[currentToken].isActive) {
            _endTerm(currentToken);
        }

        uint256 tokenId = nextTokenId++;
        uint256 termEnd = block.timestamp + termDuration;

        positions[tokenId] = CouncilPosition({
            role: role,
            electedAt: block.timestamp,
            termEnd: termEnd,
            isActive: true,
            ipfsMetadata: metadata
        });

        activeRoleToken[role] = tokenId;
        _safeMint(member, tokenId);

        emit Elected(member, role, tokenId, termEnd);
        return tokenId;
    }

    /**
     * @dev Terminar mandato manualmente (ej: renuncia)
     */
    function endTerm(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender || hasRole(ELECTION_ROLE, msg.sender), "Not authorized");
        require(positions[tokenId].isActive, "Already ended");
        _endTerm(tokenId);
    }

    /**
     * @dev Moción de censura (impeachment)
     */
    function impeach(uint256 tokenId, string memory reason) 
        external 
        onlyRole(ELECTION_ROLE) 
    {
        require(positions[tokenId].isActive, "Already ended");
        
        CouncilPosition storage pos = positions[tokenId];
        pos.isActive = false;
        activeRoleToken[pos.role] = 0;

        emit Impeached(tokenId, pos.role, reason);
    }

    function _endTerm(uint256 tokenId) internal {
        CouncilPosition storage pos = positions[tokenId];
        pos.isActive = false;
        
        if (activeRoleToken[pos.role] == tokenId) {
            activeRoleToken[pos.role] = 0;
        }

        emit TermEnded(tokenId, pos.role);
    }

    /**
     * @dev Verificar si una dirección tiene un cargo activo
     */
    function hasActiveRole(address member) external view returns (bool) {
        uint256 balance = balanceOf(member);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(member, i);
            if (positions[tokenId].isActive && positions[tokenId].termEnd > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Obtener el cargo activo de una dirección
     */
    function getActiveRole(address member) external view returns (Role, uint256) {
        uint256 balance = balanceOf(member);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(member, i);
            CouncilPosition storage pos = positions[tokenId];
            if (pos.isActive && pos.termEnd > block.timestamp) {
                return (pos.role, tokenId);
            }
        }
        revert("No active role");
    }

    /**
     * @dev Nombre del rol
     */
    function getRoleName(Role role) public pure returns (string memory) {
        if (role == Role.PRESIDENT) return "Presidente";
        if (role == Role.VICE_PRESIDENT) return "Vicepresidente";
        if (role == Role.TREASURER) return "Tesorero";
        if (role == Role.SECRETARY) return "Secretario";
        if (role == Role.VOCAL) return "Vocal";
        return "Desconocido";
    }

    // ============ Soulbound (No Transferible) ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Permitir mint (from == 0) y burn (to == 0)
        // Bloquear transferencias normales
        if (from != address(0) && to != address(0)) {
            revert("Council roles are non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // ============ Admin ============

    function setTermDuration(uint256 _duration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_duration >= 30 days, "Too short");
        termDuration = _duration;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
