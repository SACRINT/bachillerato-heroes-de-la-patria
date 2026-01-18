// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title HeroesTimelock
 * @dev Timelock controller para la DAO BGE.
 * Añade un retraso entre la aprobación de una propuesta y su ejecución.
 * Esto da tiempo a los usuarios para reaccionar a decisiones controvertidas.
 */
contract HeroesTimelock is TimelockController {
    /**
     * @dev Constructor del Timelock
     * @param minDelay Retraso mínimo entre aprobación y ejecución (ej: 2 días)
     * @param proposers Lista de direcciones que pueden proponer operaciones
     * @param executors Lista de direcciones que pueden ejecutar operaciones
     * @param admin Administrador inicial (puede ser address(0) para renunciar)
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
