import { expect } from "chai";
import { ethers } from "hardhat";
import { AcademyCredential } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AcademyCredential (NFT)", function () {
    let credential: AcademyCredential;
    let admin: HardhatEthersSigner;
    let student1: HardhatEthersSigner;
    let student2: HardhatEthersSigner;
    let other: HardhatEthersSigner;

    const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

    beforeEach(async function () {
        [admin, student1, student2, other] = await ethers.getSigners();
        const CredentialFactory = await ethers.getContractFactory("AcademyCredential");
        credential = await CredentialFactory.deploy();
        await credential.waitForDeployment();
    });

    describe("Access Control", function () {
        it("Should grant issuer role to deployer", async function () {
            expect(await credential.hasRole(ISSUER_ROLE, admin.address)).to.be.true;
        });

        it("Should fail if non-issuer tries to issue", async function () {
            await expect(
                credential.connect(other).issueCredential(student1.address, "uri")
            ).to.be.revertedWithCustomError(credential, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Issuance", function () {
        it("Should issue a single credential", async function () {
            await credential.issueCredential(student1.address, "ipfs://diploma-1");
            expect(await credential.balanceOf(student1.address)).to.equal(1);
            expect(await credential.tokenURI(0)).to.equal("ipfs://diploma-1");
        });

        it("Should batch issue credentials correctly", async function () {
            const addresses = [student1.address, student2.address];
            const uris = ["ipfs://diploma-1", "ipfs://diploma-2"];

            await credential.batchIssueCredentials(addresses, uris);

            expect(await credential.balanceOf(student1.address)).to.equal(1);
            expect(await credential.balanceOf(student2.address)).to.equal(1);
            expect(await credential.ownerOf(0)).to.equal(student1.address);
            expect(await credential.ownerOf(1)).to.equal(student2.address);
        });
    });

    describe("Revocation", function () {
        it("Should allow admin to revoke credential", async function () {
            await credential.issueCredential(student1.address, "ipfs://fake");
            await credential.revokeCredential(0, "Fraud detected");

            await expect(credential.ownerOf(0)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
        });
    });
});
