import { expect } from "chai";
import { ethers } from "hardhat";
import { StudentIdentity, AcademyCredential } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Security Audit Tests", function () {
    let sbt: StudentIdentity;
    let cert: AcademyCredential;
    let admin: HardhatEthersSigner;
    let hacker: HardhatEthersSigner;
    let student: HardhatEthersSigner;

    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

    beforeEach(async function () {
        [admin, hacker, student] = await ethers.getSigners();

        // Deploy SBT
        const SBTFactory = await ethers.getContractFactory("StudentIdentity");
        sbt = await SBTFactory.deploy();
        await sbt.waitForDeployment();

        // Deploy Certs
        const CertFactory = await ethers.getContractFactory("AcademyCredential");
        cert = await CertFactory.deploy();
        await cert.waitForDeployment();
    });

    describe("Emergency Stop (Pausable)", function () {
        it("Hacker cannot pause the contract", async function () {
            await expect(
                sbt.connect(hacker).pause()
            ).to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount");
        });

        it("Admin can pause and it BLOCKS minting", async function () {
            await sbt.pause();

            await expect(
                sbt.safeMint(student.address, "uri")
            ).to.be.revertedWithCustomError(sbt, "EnforcedPause");
        });

        it("Admin can pause and it BLOCKS transfers (Certs)", async function () {
            // Issue first
            await cert.issueCredential(student.address, "uri");

            // Pause
            await cert.pause();

            // Try transfer
            await expect(
                cert.connect(student).transferFrom(student.address, hacker.address, 0)
            ).to.be.revertedWithCustomError(cert, "EnforcedPause");
        });
    });

    describe("Access Control & Role Escalation", function () {
        it("Hacker cannot grant himself Admin role", async function () {
            await expect(
                sbt.connect(hacker).grantRole(DEFAULT_ADMIN_ROLE, hacker.address)
            ).to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount");
        });

        it("Hacker cannot revoke credentials", async function () {
            await cert.issueCredential(student.address, "uri");

            await expect(
                cert.connect(hacker).revokeCredential(0, "Hacked")
            ).to.be.revertedWithCustomError(cert, "AccessControlUnauthorizedAccount");
        });
    });
});
