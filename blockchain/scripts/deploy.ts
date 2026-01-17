import { ethers } from "hardhat";

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    console.log("Iniciando despliegue...");

    const greeting = "¡Hola Futuro Héroe del Metaverso!";

    const greeter = await ethers.deployContract("Greeter", [greeting]);

    await greeter.waitForDeployment();

    console.log(
        `Greeter desplegado con saludo "${greeting}" en la dirección: ${greeter.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
