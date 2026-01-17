import { ethers } from "hardhat";

async function main() {
    console.log("Iniciando despliegue de IACoin...");

    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    const iacoin = await ethers.deployContract("IACoin");
    await iacoin.waitForDeployment();
    const tokenAddress = await iacoin.getAddress();

    console.log(`✅ IACoin desplegado en: ${tokenAddress}`);

    // Opcional: Mintear suministro inicial para pruebas
    const initialSupply = ethers.parseEther("1000000"); // 1 millón de tokens
    console.log("Minteando suministro inicial (1,000,000 IAC)...");
    await iacoin.mint(deployer.address, initialSupply);

    console.log("✅ Suministro inicial minteado a:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
