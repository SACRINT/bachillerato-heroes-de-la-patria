// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title HeroesGovernor
 * @dev Contrato Governor para la DAO educativa BGE.
 * Gestiona propuestas, votaciones y ejecución de decisiones.
 */
contract HeroesGovernor is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction,
    GovernorTimelockControl 
{
    // Categorías de propuesta
    enum ProposalCategory { UPGRADE, EVENT, FUNDING, POLICY, EMERGENCY }
    
    mapping(uint256 => ProposalCategory) public proposalCategories;
    mapping(uint256 => string) public proposalDescriptionHashes; // IPFS CIDs
    
    // Eventos adicionales
    event ProposalCategorized(uint256 proposalId, ProposalCategory category);

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("HeroesGovernor")
        GovernorSettings(
            1 days,     // Voting delay: 1 día para revisar antes de votar
            1 weeks,    // Voting period: 1 semana para votar
            1000e18     // Proposal threshold: 1000 tokens para proponer
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(10) // 10% quórum
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @dev Crear propuesta con categoría
     */
    function proposeWithCategory(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalCategory category,
        string memory ipfsHash
    ) public returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        proposalDescriptionHashes[proposalId] = ipfsHash;
        
        emit ProposalCategorized(proposalId, category);
        return proposalId;
    }

    /**
     * @dev Ver categoría de una propuesta
     */
    function getProposalCategory(uint256 proposalId) public view returns (ProposalCategory) {
        return proposalCategories[proposalId];
    }

    // ============ Overrides Requeridos ============

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
