// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ScholarshipManager
 * @dev Sistema de Becas Inteligentes para BGE Héroes de la Patria.
 * Distribuye fondos automáticamente basándose en el rendimiento académico.
 */
contract ScholarshipManager is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    IERC20 public immutable scholarshipToken; // IACoin

    // Tipos de beca
    enum ScholarshipType { MERIT, NEED, SPORTS, ARTS, STEM }

    // Estado de la beca
    enum ScholarshipStatus { PENDING, APPROVED, ACTIVE, REVOKED, COMPLETED }

    // Estructura de beca
    struct Scholarship {
        address student;
        ScholarshipType sType;
        ScholarshipStatus status;
        uint256 monthlyAmount;
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 startTime;
        uint256 lastPaymentTime;
        uint256 duration;           // En meses
        uint256 requiredGrade;      // Promedio mínimo (ej: 90 = 9.0)
        uint256 currentGrade;       // Actualizado por oráculo
    }

    uint256 public nextScholarshipId = 1;
    mapping(uint256 => Scholarship) public scholarships;
    mapping(address => uint256[]) public studentScholarships;

    // Pool de fondos
    uint256 public scholarshipPool;
    uint256 public totalAllocated;

    // Stats
    uint256 public totalScholarshipsGranted;
    uint256 public totalFundsDistributed;

    // Eventos
    event ScholarshipCreated(uint256 indexed id, address indexed student, ScholarshipType sType, uint256 monthlyAmount);
    event ScholarshipApproved(uint256 indexed id);
    event PaymentProcessed(uint256 indexed id, address indexed student, uint256 amount);
    event ScholarshipRevoked(uint256 indexed id, string reason);
    event DonationReceived(address indexed donor, uint256 amount);
    event GradeUpdated(uint256 indexed id, uint256 newGrade);

    constructor(address _token) {
        scholarshipToken = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Solicitar una beca
     */
    function applyForScholarship(
        ScholarshipType _type,
        uint256 _requestedMonthly,
        uint256 _duration
    ) external whenNotPaused returns (uint256) {
        require(_requestedMonthly > 0, "Invalid amount");
        require(_duration > 0 && _duration <= 12, "Invalid duration");

        uint256 id = nextScholarshipId++;
        uint256 totalRequested = _requestedMonthly * _duration;

        scholarships[id] = Scholarship({
            student: msg.sender,
            sType: _type,
            status: ScholarshipStatus.PENDING,
            monthlyAmount: _requestedMonthly,
            totalAmount: totalRequested,
            paidAmount: 0,
            startTime: 0,
            lastPaymentTime: 0,
            duration: _duration,
            requiredGrade: 90,  // Por defecto: 9.0
            currentGrade: 0
        });

        studentScholarships[msg.sender].push(id);

        emit ScholarshipCreated(id, msg.sender, _type, _requestedMonthly);
        return id;
    }

    /**
     * @dev Aprobar una beca (Admin)
     */
    function approveScholarship(uint256 _id, uint256 _requiredGrade) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        Scholarship storage s = scholarships[_id];
        require(s.status == ScholarshipStatus.PENDING, "Not pending");
        require(scholarshipPool >= s.totalAmount, "Insufficient funds");

        s.status = ScholarshipStatus.APPROVED;
        s.requiredGrade = _requiredGrade;
        s.startTime = block.timestamp;
        s.lastPaymentTime = block.timestamp;

        totalAllocated += s.totalAmount;
        totalScholarshipsGranted++;

        emit ScholarshipApproved(_id);
    }

    /**
     * @dev Activar y procesar primer pago
     */
    function activateScholarship(uint256 _id) external onlyRole(ADMIN_ROLE) {
        Scholarship storage s = scholarships[_id];
        require(s.status == ScholarshipStatus.APPROVED, "Not approved");

        s.status = ScholarshipStatus.ACTIVE;
        _processPayment(_id);
    }

    /**
     * @dev Procesar pago mensual
     */
    function processMonthlyPayment(uint256 _id) external nonReentrant {
        Scholarship storage s = scholarships[_id];
        require(s.status == ScholarshipStatus.ACTIVE, "Not active");
        require(block.timestamp >= s.lastPaymentTime + 30 days, "Too early");
        require(s.paidAmount < s.totalAmount, "Fully paid");

        // Verificar que cumple requisitos académicos
        require(s.currentGrade >= s.requiredGrade, "Grade below requirement");

        _processPayment(_id);
    }

    /**
     * @dev Procesar pago interno
     */
    function _processPayment(uint256 _id) internal {
        Scholarship storage s = scholarships[_id];
        
        uint256 remaining = s.totalAmount - s.paidAmount;
        uint256 payment = remaining < s.monthlyAmount ? remaining : s.monthlyAmount;

        require(scholarshipPool >= payment, "Pool depleted");

        s.paidAmount += payment;
        s.lastPaymentTime = block.timestamp;
        scholarshipPool -= payment;
        totalFundsDistributed += payment;

        scholarshipToken.safeTransfer(s.student, payment);

        emit PaymentProcessed(_id, s.student, payment);

        // Marcar como completada si se pagó todo
        if (s.paidAmount >= s.totalAmount) {
            s.status = ScholarshipStatus.COMPLETED;
            totalAllocated -= s.totalAmount;
        }
    }

    /**
     * @dev Actualizar calificación del estudiante (Oráculo)
     */
    function updateStudentGrade(uint256 _id, uint256 _grade) 
        external 
        onlyRole(ORACLE_ROLE) 
    {
        Scholarship storage s = scholarships[_id];
        s.currentGrade = _grade;

        emit GradeUpdated(_id, _grade);

        // Revocar automáticamente si baja demasiado
        if (s.status == ScholarshipStatus.ACTIVE && _grade < s.requiredGrade - 10) {
            _revokeScholarship(_id, "Grade dropped significantly");
        }
    }

    /**
     * @dev Revocar beca
     */
    function revokeScholarship(uint256 _id, string memory _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _revokeScholarship(_id, _reason);
    }

    function _revokeScholarship(uint256 _id, string memory _reason) internal {
        Scholarship storage s = scholarships[_id];
        require(s.status == ScholarshipStatus.ACTIVE || s.status == ScholarshipStatus.APPROVED, "Cannot revoke");

        uint256 unpaid = s.totalAmount - s.paidAmount;
        totalAllocated -= unpaid;
        s.status = ScholarshipStatus.REVOKED;

        emit ScholarshipRevoked(_id, _reason);
    }

    /**
     * @dev Donar al fondo de becas
     */
    function donate(uint256 _amount) external {
        scholarshipToken.safeTransferFrom(msg.sender, address(this), _amount);
        scholarshipPool += _amount;

        emit DonationReceived(msg.sender, _amount);
    }

    // ============ Views ============

    function getScholarshipDetails(uint256 _id) external view returns (Scholarship memory) {
        return scholarships[_id];
    }

    function getStudentScholarships(address _student) external view returns (uint256[] memory) {
        return studentScholarships[_student];
    }

    function getAvailableFunds() external view returns (uint256) {
        return scholarshipPool - totalAllocated;
    }

    // ============ Admin ============

    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }
}
