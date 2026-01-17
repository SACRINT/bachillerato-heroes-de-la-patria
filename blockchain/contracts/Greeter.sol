// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

/**
 * @title Greeter
 * @dev Contrato simple de prueba para el entorno del Metaverso
 */
contract Greeter {
    string private _greeting;
    address public owner;

    event GreetingChanged(address indexed changer, string newGreeting);

    constructor(string memory greeting) {
        console.log("Desplegando Greeter con el saludo:", greeting);
        _greeting = greeting;
        owner = msg.sender;
    }

    function greet() public view returns (string memory) {
        return _greeting;
    }

    function setGreeting(string memory greeting) public {
        console.log("Cambiando saludo de '%s' a '%s'", _greeting, greeting);
        _greeting = greeting;
        emit GreetingChanged(msg.sender, greeting);
    }
}
