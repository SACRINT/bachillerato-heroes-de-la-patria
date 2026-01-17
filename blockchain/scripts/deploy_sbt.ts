import { ethers } from "hardhat";

async function main() {
    console.log("Iniciando despliegue de StudentIdentity (SBT)...");

    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    const sbt = await ethers.deployContract("StudentIdentity");
    await sbt.waitForDeployment();
    const sbtAddress = await sbt.getAddress();

    console.log(`✅ StudentIdentity (SBT) desplegado en: ${sbtAddress}`);
    console.log("⚠️ Recuerda: Este token es intransferible.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
