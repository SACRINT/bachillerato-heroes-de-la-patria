import { ethers } from "hardhat";

async function main() {
    console.log("Iniciando despliegue de AcademyCredential (NFT)...");

    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    const academy = await ethers.deployContract("AcademyCredential");
    await academy.waitForDeployment();
    const address = await academy.getAddress();

    console.log(`✅ AcademyCredential (NFT) desplegado en: ${address}`);
    console.log("ℹ️ Este contrato administra los Diplomas y Certificados.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
