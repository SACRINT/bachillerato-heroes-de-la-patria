// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ReputationOracle
 * @dev Sistema de reputación on-chain para la DAO educativa.
 * La reputación influye en el peso de voto y acceso a funciones especiales.
 */
contract ReputationOracle is AccessControl, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Factores que contribuyen a la reputación
    struct ReputationFactors {
        uint256 academicScore;      // Basado en calificaciones (0-1000)
        uint256 participationScore; // Basado en asistencia/actividad (0-1000)
        uint256 governanceScore;    // Basado en votaciones (0-1000)
        uint256 communityScore;     // Basado en contribuciones (0-1000)
        uint256 lastUpdate;
        bool isActive;
    }

    mapping(address => ReputationFactors) public reputations;
    
    // Pesos de cada factor (suman 100)
    uint256 public academicWeight = 30;
    uint256 public participationWeight = 25;
    uint256 public governanceWeight = 25;
    uint256 public communityWeight = 20;

    // Decaimiento por inactividad
    uint256 public decayPeriod = 30 days;
    uint256 public decayRate = 50; // 5% por periodo

    // Umbrales de nivel
    uint256 public constant LEVEL_BRONZE = 200;
    uint256 public constant LEVEL_SILVER = 400;
    uint256 public constant LEVEL_GOLD = 600;
    uint256 public constant LEVEL_PLATINUM = 800;

    // Eventos
    event ReputationUpdated(address indexed user, uint256 newScore);
    event FactorUpdated(address indexed user, string factor, uint256 value);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Actualizar factor académico
     */
    function updateAcademicScore(address user, uint256 score) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(score <= 1000, "Score out of range");
        reputations[user].academicScore = score;
        reputations[user].lastUpdate = block.timestamp;
        reputations[user].isActive = true;
        
        emit FactorUpdated(user, "academic", score);
        emit ReputationUpdated(user, getTotalReputation(user));
    }

    /**
     * @dev Actualizar factor de participación
     */
    function updateParticipationScore(address user, uint256 score) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(score <= 1000, "Score out of range");
        reputations[user].participationScore = score;
        reputations[user].lastUpdate = block.timestamp;
        reputations[user].isActive = true;
        
        emit FactorUpdated(user, "participation", score);
        emit ReputationUpdated(user, getTotalReputation(user));
    }

    /**
     * @dev Actualizar factor de gobernanza (llamado después de votar)
     */
    function updateGovernanceScore(address user, uint256 score) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(score <= 1000, "Score out of range");
        reputations[user].governanceScore = score;
        reputations[user].lastUpdate = block.timestamp;
        
        emit FactorUpdated(user, "governance", score);
        emit ReputationUpdated(user, getTotalReputation(user));
    }

    /**
     * @dev Actualizar factor comunitario
     */
    function updateCommunityScore(address user, uint256 score) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        require(score <= 1000, "Score out of range");
        reputations[user].communityScore = score;
        reputations[user].lastUpdate = block.timestamp;
        
        emit FactorUpdated(user, "community", score);
        emit ReputationUpdated(user, getTotalReputation(user));
    }

    /**
     * @dev Actualizar todos los factores de una vez (batch)
     */
    function updateAllFactors(
        address user,
        uint256 academic,
        uint256 participation,
        uint256 governance,
        uint256 community
    ) external onlyRole(ORACLE_ROLE) {
        require(academic <= 1000 && participation <= 1000 && 
                governance <= 1000 && community <= 1000, "Score out of range");
        
        ReputationFactors storage rep = reputations[user];
        rep.academicScore = academic;
        rep.participationScore = participation;
        rep.governanceScore = governance;
        rep.communityScore = community;
        rep.lastUpdate = block.timestamp;
        rep.isActive = true;
        
        emit ReputationUpdated(user, getTotalReputation(user));
    }

    /**
     * @dev Calcular reputación total (con decaimiento)
     */
    function getTotalReputation(address user) public view returns (uint256) {
        ReputationFactors storage rep = reputations[user];
        
        if (!rep.isActive) return 0;
        
        // Calcular score base
        uint256 baseScore = (
            rep.academicScore * academicWeight +
            rep.participationScore * participationWeight +
            rep.governanceScore * governanceWeight +
            rep.communityScore * communityWeight
        ) / 100;
        
        // Aplicar decaimiento si ha pasado tiempo
        uint256 timeSinceUpdate = block.timestamp - rep.lastUpdate;
        if (timeSinceUpdate > decayPeriod) {
            uint256 decayPeriods = timeSinceUpdate / decayPeriod;
            uint256 totalDecay = decayPeriods * decayRate;
            
            if (totalDecay >= 1000) return 0;
            
            baseScore = baseScore * (1000 - totalDecay) / 1000;
        }
        
        return baseScore;
    }

    /**
     * @dev Obtener nivel de reputación
     */
    function getReputationLevel(address user) external view returns (string memory) {
        uint256 rep = getTotalReputation(user);
        
        if (rep >= LEVEL_PLATINUM) return "Platinum";
        if (rep >= LEVEL_GOLD) return "Gold";
        if (rep >= LEVEL_SILVER) return "Silver";
        if (rep >= LEVEL_BRONZE) return "Bronze";
        return "Novice";
    }

    /**
     * @dev Verificar si puede crear propuestas (umbral mínimo)
     */
    function canPropose(address user) external view returns (bool) {
        return getTotalReputation(user) >= LEVEL_SILVER;
    }

    /**
     * @dev Multiplicador de voto basado en reputación (1.0x - 2.0x)
     * Retorna valor en basis points (10000 = 1.0x)
     */
    function getVoteMultiplier(address user) external view returns (uint256) {
        uint256 rep = getTotalReputation(user);
        
        // Base: 10000 (1.0x)
        // Max: 20000 (2.0x) si reputación = 1000
        return 10000 + (rep * 10000 / 1000);
    }

    // ============ Admin ============

    function setWeights(
        uint256 _academic,
        uint256 _participation,
        uint256 _governance,
        uint256 _community
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_academic + _participation + _governance + _community == 100, "Must sum to 100");
        academicWeight = _academic;
        participationWeight = _participation;
        governanceWeight = _governance;
        communityWeight = _community;
    }

    function setDecayParams(uint256 _period, uint256 _rate) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_rate <= 200, "Decay too aggressive"); // Max 20% por periodo
        decayPeriod = _period;
        decayRate = _rate;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
