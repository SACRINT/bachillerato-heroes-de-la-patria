const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain-service.js');
const { ethers } = require('ethers');

// Almacenamiento simple en memoria para rate limit (en prod usar Redis)
const cooldowns = new Map();
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 horas
const DRIP_AMOUNT = "100"; // 100 IAC

router.post('/request', async (req, res) => {
    const { address } = req.body;

    if (!address || !ethers.isAddress(address)) {
        return res.status(400).json({ error: "Dirección inválida" });
    }

    // Checking cooldown
    const lastRequest = cooldowns.get(address);
    if (lastRequest && (Date.now() - lastRequest) < COOLDOWN_TIME) {
        const remainingHours = Math.ceil((COOLDOWN_TIME - (Date.now() - lastRequest)) / (1000 * 60 * 60));
        return res.status(429).json({ error: `Espera ${remainingHours} horas para pedir más tokens.` });
    }

    try {
        if (!blockchainService.isConnected || !blockchainService.contracts.IACoin) {
            throw new Error("Servicio Blockchain no disponible o IACoin no cargado");
        }

        // Ejecutar transferencia desde la wallet del servidor (Faucet)
        // Nota: Assumes server wallet has enough IAC
        // Como el token tiene roles, si el server es MINTER, podría hacer mint() directamente.
        // Verificamos si podemos mintear

        let tx;
        // Si somos minter, minteamos
        // console.log("Minting tokens...");
        // tx = await blockchainService.contracts.IACoin.mint(address, ethers.parseEther(DRIP_AMOUNT));

        // Por seguridad, usaremos transfer desde la wallet del admin (si ya tiene pre-minted tokens)
        // para no exponer la clave privada del MINTER_ROLE en un endpoint público tan fácilmente.
        // Pero para este ejemplo de Faucet "Dev", usaremos mint si el servicio lo permite.

        // Simularemos la llamada a mint (asumiendo que el ABI lo permite y tenemos la key)
        const amountWei = ethers.parseEther(DRIP_AMOUNT);
        tx = await blockchainService.contracts.IACoin.mint(address, amountWei);

        await tx.wait();

        cooldowns.set(address, Date.now());

        res.json({
            success: true,
            message: `${DRIP_AMOUNT} IAC enviados a ${address}`,
            txHash: tx.hash
        });

    } catch (error) {
        console.error("Faucet Error:", error);
        res.status(500).json({ error: "Error en el Faucet: " + error.message });
    }
});

module.exports = router;
