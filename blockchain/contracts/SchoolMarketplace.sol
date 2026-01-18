// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SchoolMarketplace
 * @dev Marketplace descentralizado para el ecosistema educativo BGE.
 * Permite comprar/vender NFTs (ERC-1155) usando IACoins (ERC-20).
 */
contract SchoolMarketplace is ERC1155Holder, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable paymentToken;    // IACoin
    IERC1155 public immutable assetsContract; // SchoolAssets
    
    // Configuración
    uint256 public marketplaceFee = 250;      // 2.5% fee para la tesorería
    address public treasury;
    
    // Listado de items
    struct Listing {
        address seller;
        uint256 itemId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
    }
    
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;
    
    // Índices para búsqueda
    mapping(address => uint256[]) public sellerListings;
    mapping(uint256 => uint256[]) public itemListings; // itemId => listingIds[]
    
    // Eventos
    event ItemListed(uint256 indexed listingId, address indexed seller, uint256 itemId, uint256 amount, uint256 pricePerUnit);
    event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event ListingCancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFee);

    constructor(
        address _paymentToken,
        address _assetsContract,
        address _treasury
    ) {
        paymentToken = IERC20(_paymentToken);
        assetsContract = IERC1155(_assetsContract);
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Listar un item para venta
     */
    function listItem(uint256 _itemId, uint256 _amount, uint256 _pricePerUnit) 
        external 
        whenNotPaused 
        nonReentrant
        returns (uint256)
    {
        require(_amount > 0, "Amount must be > 0");
        require(_pricePerUnit > 0, "Price must be > 0");
        require(assetsContract.balanceOf(msg.sender, _itemId) >= _amount, "Insufficient balance");
        
        // Transferir NFTs al marketplace (escrow)
        assetsContract.safeTransferFrom(msg.sender, address(this), _itemId, _amount, "");
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            itemId: _itemId,
            amount: _amount,
            pricePerUnit: _pricePerUnit,
            active: true
        });
        
        sellerListings[msg.sender].push(listingId);
        itemListings[_itemId].push(listingId);
        
        emit ItemListed(listingId, msg.sender, _itemId, _amount, _pricePerUnit);
        
        return listingId;
    }

    /**
     * @dev Comprar items de un listado
     */
    function buyItem(uint256 _listingId, uint256 _amount) 
        external 
        whenNotPaused 
        nonReentrant
    {
        Listing storage listing = listings[_listingId];
        
        require(listing.active, "Listing not active");
        require(_amount > 0 && _amount <= listing.amount, "Invalid amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        uint256 totalPrice = listing.pricePerUnit * _amount;
        uint256 fee = (totalPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = totalPrice - fee;
        
        // Verificar balance del comprador
        require(paymentToken.balanceOf(msg.sender) >= totalPrice, "Insufficient balance");
        
        // Transferir pago
        paymentToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        paymentToken.safeTransferFrom(msg.sender, treasury, fee);
        
        // Transferir NFTs al comprador
        assetsContract.safeTransferFrom(address(this), msg.sender, listing.itemId, _amount, "");
        
        // Actualizar listing
        listing.amount -= _amount;
        if (listing.amount == 0) {
            listing.active = false;
        }
        
        emit ItemSold(_listingId, msg.sender, _amount, totalPrice);
    }

    /**
     * @dev Cancelar un listado y recuperar los items
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        
        // Devolver NFTs al vendedor
        assetsContract.safeTransferFrom(address(this), msg.sender, listing.itemId, listing.amount, "");
        
        emit ListingCancelled(_listingId);
    }

    /**
     * @dev Ver listados activos de un item
     */
    function getActiveListingsForItem(uint256 _itemId) external view returns (uint256[] memory) {
        uint256[] storage allListings = itemListings[_itemId];
        uint256 activeCount = 0;
        
        // Contar activos
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active) {
                activeCount++;
            }
        }
        
        // Crear array de activos
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allListings.length; i++) {
            if (listings[allListings[i]].active) {
                activeListings[index++] = allListings[i];
            }
        }
        
        return activeListings;
    }

    // ============ Admin ============
    
    function setFee(uint256 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _newFee;
        emit FeeUpdated(_newFee);
    }
    
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
    }
    
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // Requerido para recibir ERC1155
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Holder, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
