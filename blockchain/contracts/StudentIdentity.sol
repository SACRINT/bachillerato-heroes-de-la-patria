// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StudentIdentity (SBT)
 * @dev Token de Identidad Estudiantil Intransferible (Soulbound Token).
 * Representa la identidad académica de un alumno en la blockchain.
 */
contract StudentIdentity is ERC721, ERC721URIStorage, AccessControl, ERC721Burnable, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 private _nextTokenId;

    // Mapping de address a tokenId para evitar múltiples identidades por wallet
    mapping(address => uint256) public studentToTokenId;

    event IdentityIssued(address indexed student, uint256 tokenId);
    event IdentityRevoked(address indexed student, uint256 tokenId);

    constructor() ERC721("BGE Student Identity", "BGEID") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emite una nueva identidad a un estudiante.
     * Solo una identidad por dirección.
     */
    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        require(balanceOf(to) == 0, "Student already has an identity");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        studentToTokenId[to] = tokenId;

        emit IdentityIssued(to, tokenId);
    }

    /**
     * @dev Bloquea las transferencias para hacer el token Soulbound.
     * Solo permite minting (from == 0) y burning (to == 0).
     * Tambien verifica si el contrato esta pausado.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        // Verificar pausa antes de cualquier operación de tokens
        _requireNotPaused();

        address from = _ownerOf(tokenId);
        
        // Si no es minting (from != 0) ni burning (to != 0), revertir.
        // from == address(0) implica minting
        // to == address(0) implica burning
        if (from != address(0) && to != address(0)) {
            revert("StudentIdentity: Soulbound tokens cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Revoca una identidad (quema el token).
     * Puede ser llamado por el admin o por el estudiante (si decide borrar su identidad).
     */
    function revoke(uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        
        // Verificar permisos: Admin o Dueño
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && owner != msg.sender) {
             revert("AccessControl: caller is not owner nor admin");
        }
        
        _burn(tokenId);
        delete studentToTokenId[owner];
        emit IdentityRevoked(owner, tokenId);
    }

    // Overrides requeridos por Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
