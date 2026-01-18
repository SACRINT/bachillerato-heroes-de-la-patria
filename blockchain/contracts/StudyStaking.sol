// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StudyStaking
 * @dev Contrato de Staking "Study-to-Earn" para BGE Héroes de la Patria.
 * Los estudiantes stakean IACoins y ganan rewards basados en su rendimiento académico.
 */
contract StudyStaking is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable stakingToken;  // IACoin
    
    // Configuración del pool
    uint256 public baseAPY = 500;           // 5% base APY (en basis points, 10000 = 100%)
    uint256 public bonusAPYPerPoint = 50;   // +0.5% por cada punto sobre 8.0 de promedio
    uint256 public lockPeriod = 90 days;    // Periodo mínimo de bloqueo (1 semestre ~ 90 días)
    uint256 public earlyWithdrawPenalty = 1000; // 10% penalización por retiro anticipado
    
    // Estado del usuario
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 gradeBonus;      // Bonus basado en calificaciones (actualizado por oráculo)
        uint256 pendingRewards;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // Pool de recompensas
    uint256 public rewardsPool;
    
    // Eventos
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 amount);
    event GradeBonusUpdated(address indexed user, uint256 newBonus);
    event RewardsPoolFunded(uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Deposita tokens en staking
     */
    function stake(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        // Calcular rewards pendientes antes de modificar el stake
        _updatePendingRewards(msg.sender);
        
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.amount += _amount;
        
        if (userStake.startTime == 0) {
            userStake.startTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
        }
        
        emit Staked(msg.sender, _amount);
    }

    /**
     * @dev Retira tokens del staking
     * Si es antes del lockPeriod, aplica penalización
     */
    function withdraw(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked balance");
        
        _updatePendingRewards(msg.sender);
        
        uint256 penalty = 0;
        uint256 timeStaked = block.timestamp - userStake.startTime;
        
        // Aplicar penalización si retira antes del periodo de bloqueo
        if (timeStaked < lockPeriod) {
            penalty = (_amount * earlyWithdrawPenalty) / 10000;
        }
        
        uint256 amountAfterPenalty = _amount - penalty;
        userStake.amount -= _amount;
        
        // Penalización va al pool de rewards
        if (penalty > 0) {
            rewardsPool += penalty;
        }
        
        stakingToken.safeTransfer(msg.sender, amountAfterPenalty);
        
        emit Withdrawn(msg.sender, amountAfterPenalty, penalty);
    }

    /**
     * @dev Reclama las recompensas acumuladas
     */
    function claimRewards() external nonReentrant {
        _updatePendingRewards(msg.sender);
        
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 rewards = userStake.pendingRewards;
        
        require(rewards > 0, "No rewards to claim");
        require(rewardsPool >= rewards, "Rewards pool depleted");
        
        userStake.pendingRewards = 0;
        userStake.lastClaimTime = block.timestamp;
        rewardsPool -= rewards;
        
        stakingToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Actualiza el bonus de un estudiante basado en su promedio
     * Solo puede ser llamado por el ORACLE_ROLE (backend autorizado)
     * @param _student Dirección del estudiante
     * @param _gradeAverage Promedio (ej: 95 = 9.5)
     */
    function updateGradeBonus(address _student, uint256 _gradeAverage) external onlyRole(ORACLE_ROLE) {
        _updatePendingRewards(_student);
        
        // Bonus solo si promedio > 80 (8.0)
        uint256 bonus = 0;
        if (_gradeAverage > 80) {
            bonus = (_gradeAverage - 80) * bonusAPYPerPoint;
        }
        
        stakes[_student].gradeBonus = bonus;
        
        emit GradeBonusUpdated(_student, bonus);
    }

    /**
     * @dev Calcula el APY efectivo de un usuario
     */
    function getEffectiveAPY(address _user) public view returns (uint256) {
        return baseAPY + stakes[_user].gradeBonus;
    }

    /**
     * @dev Calcula rewards pendientes (interno)
     */
    function _updatePendingRewards(address _user) internal {
        StakeInfo storage userStake = stakes[_user];
        
        if (userStake.amount == 0) return;
        
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        uint256 effectiveAPY = getEffectiveAPY(_user);
        
        // Rewards = (amount * APY * time) / (365 days * 10000)
        uint256 rewards = (userStake.amount * effectiveAPY * timeElapsed) / (365 days * 10000);
        
        userStake.pendingRewards += rewards;
        userStake.lastClaimTime = block.timestamp;
    }

    /**
     * @dev Ver rewards pendientes (view)
     */
    function getPendingRewards(address _user) external view returns (uint256) {
        StakeInfo storage userStake = stakes[_user];
        
        if (userStake.amount == 0) return userStake.pendingRewards;
        
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        uint256 effectiveAPY = getEffectiveAPY(_user);
        uint256 newRewards = (userStake.amount * effectiveAPY * timeElapsed) / (365 days * 10000);
        
        return userStake.pendingRewards + newRewards;
    }

    /**
     * @dev Fondear el pool de recompensas
     */
    function fundRewardsPool(uint256 _amount) external {
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        rewardsPool += _amount;
        emit RewardsPoolFunded(_amount);
    }

    // Admin functions
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
    
    function setBaseAPY(uint256 _newAPY) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newAPY <= 5000, "APY too high"); // Max 50%
        baseAPY = _newAPY;
    }
    
    function setLockPeriod(uint256 _newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockPeriod = _newPeriod;
    }
}
