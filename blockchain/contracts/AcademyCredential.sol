// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AcademyCredential
 * @dev Certificados y Diplomas académicos del BGE Héroes de la Patria.
 * Smart Contract para emisión de credenciales verificables on-chain.
 */
contract AcademyCredential is ERC721, ERC721URIStorage, AccessControl, ERC721Burnable, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 private _nextTokenId;

    event CredentialIssued(address indexed student, uint256 tokenId, string uri);
    event CredentialRevoked(uint256 tokenId, string reason);

    constructor() ERC721("BGE Academic Credential", "BGE-CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emite una nueva credencial a un estudiante.
     * Solo cuentas con ISSUER_ROLE pueden llamar a esta función.
     */
    function issueCredential(address to, string memory uri) public onlyRole(ISSUER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit CredentialIssued(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Emisión masiva de credenciales (ej. Graduación).
     * Optimiza gas al hacer múltiples mints en una transacción.
     */
    function batchIssueCredentials(address[] memory toList, string[] memory uriList) public onlyRole(ISSUER_ROLE) {
        require(toList.length == uriList.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < toList.length; i++) {
            issueCredential(toList[i], uriList[i]);
        }
    }

    /**
     * @dev Revoca una credencial (la quema).
     * Solo el Admin puede revocar credenciales emitidas por error o fraude.
     */
    function revokeCredential(uint256 tokenId, string memory reason) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(tokenId);
        emit CredentialRevoked(tokenId, reason);
    }

    // Hook para Pausable
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        _requireNotPaused();
        return super._update(to, tokenId, auth);
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
