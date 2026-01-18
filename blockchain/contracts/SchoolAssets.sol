// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title SchoolAssets
 * @dev Contrato ERC-1155 para items del Metaverso Educativo BGE.
 * Soporta múltiples tipos de assets: Ropa, Accesorios, Decoración, Utility.
 */
contract SchoolAssets is ERC1155, ERC1155Burnable, ERC1155Supply, AccessControl, Pausable, IERC2981 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Categorías de items
    enum Category { CLOTHING, ACCESSORY, DECORATION, UTILITY, CONSUMABLE }
    
    // Rarezas
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }
    
    // Metadata de items
    struct ItemMetadata {
        string name;
        Category category;
        Rarity rarity;
        uint256 maxSupply;      // 0 = ilimitado
        bool tradeable;
        string uri;             // IPFS URI específico
    }
    
    mapping(uint256 => ItemMetadata) public items;
    uint256 public nextItemId = 1;
    
    // Royalties (EIP-2981)
    address public royaltyReceiver;
    uint96 public royaltyFeeNumerator = 500; // 5% royalties
    
    // Eventos
    event ItemCreated(uint256 indexed itemId, string name, Category category, Rarity rarity);
    event ItemMinted(address indexed to, uint256 indexed itemId, uint256 amount);

    constructor(string memory _baseUri, address _royaltyReceiver) ERC1155(_baseUri) {
        royaltyReceiver = _royaltyReceiver;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Crear un nuevo tipo de item
     */
    function createItem(
        string memory _name,
        Category _category,
        Rarity _rarity,
        uint256 _maxSupply,
        bool _tradeable,
        string memory _uri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        uint256 itemId = nextItemId++;
        
        items[itemId] = ItemMetadata({
            name: _name,
            category: _category,
            rarity: _rarity,
            maxSupply: _maxSupply,
            tradeable: _tradeable,
            uri: _uri
        });
        
        emit ItemCreated(itemId, _name, _category, _rarity);
        return itemId;
    }

    /**
     * @dev Mintear items a un usuario
     */
    function mint(address _to, uint256 _itemId, uint256 _amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(bytes(items[_itemId].name).length > 0, "Item does not exist");
        
        ItemMetadata storage item = items[_itemId];
        
        // Verificar max supply
        if (item.maxSupply > 0) {
            require(totalSupply(_itemId) + _amount <= item.maxSupply, "Exceeds max supply");
        }
        
        _mint(_to, _itemId, _amount, "");
        
        emit ItemMinted(_to, _itemId, _amount);
    }

    /**
     * @dev Mintear múltiples items de una vez (Batch/Drops)
     */
    function mintBatch(address _to, uint256[] memory _itemIds, uint256[] memory _amounts)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        require(_itemIds.length == _amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _itemIds.length; i++) {
            require(bytes(items[_itemIds[i]].name).length > 0, "Item does not exist");
            
            ItemMetadata storage item = items[_itemIds[i]];
            if (item.maxSupply > 0) {
                require(totalSupply(_itemIds[i]) + _amounts[i] <= item.maxSupply, "Exceeds max supply");
            }
        }
        
        _mintBatch(_to, _itemIds, _amounts, "");
    }

    /**
     * @dev URI específico por item (para metadata IPFS)
     */
    function uri(uint256 _itemId) public view override returns (string memory) {
        if (bytes(items[_itemId].uri).length > 0) {
            return items[_itemId].uri;
        }
        return super.uri(_itemId);
    }

    /**
     * @dev Bloquear transferencia de items no-tradeables
     */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        // Permitir mint (from == 0) y burn (to == 0) siempre
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(items[ids[i]].tradeable, "Item is not tradeable");
            }
        }
        
        super._update(from, to, ids, values);
    }

    // ============ EIP-2981 Royalties ============
    
    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * royaltyFeeNumerator) / 10000;
    }

    function setRoyaltyInfo(address _receiver, uint96 _feeNumerator) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_feeNumerator <= 1000, "Royalty too high"); // Max 10%
        royaltyReceiver = _receiver;
        royaltyFeeNumerator = _feeNumerator;
    }

    // ============ Admin ============
    
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
    
    function setBaseURI(string memory _newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(_newUri);
    }

    // ============ Interfaces ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
