import { expect } from "chai";
import { ethers } from "hardhat";
import { StudentIdentity } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("StudentIdentity (SBT)", function () {
    let sbt: StudentIdentity;
    let admin: HardhatEthersSigner;
    let student: HardhatEthersSigner;
    let other: HardhatEthersSigner;

    beforeEach(async function () {
        [admin, student, other] = await ethers.getSigners();
        const StudentIdentityFactory = await ethers.getContractFactory("StudentIdentity");
        sbt = await StudentIdentityFactory.deploy();
        await sbt.waitForDeployment();
    });

    describe("Minting", function () {
        it("Should mint SBT to student", async function () {
            await sbt.safeMint(student.address, "ipfs://metadata-uri");
            expect(await sbt.balanceOf(student.address)).to.equal(1);
            expect(await sbt.ownerOf(0)).to.equal(student.address);
        });

        it("Should fail if student already has an identity", async function () {
            await sbt.safeMint(student.address, "ipfs://metadata-uri");
            await expect(
                sbt.safeMint(student.address, "ipfs://metadata-uri-2")
            ).to.be.revertedWith("Student already has an identity");
        });
    });

    describe("Soulbound Properties", function () {
        it("Should FAIL to transfer (Soulbound check)", async function () {
            await sbt.safeMint(student.address, "ipfs://metadata-uri");

            // Intentar transferir de student a other
            await expect(
                sbt.connect(student).transferFrom(student.address, other.address, 0)
            ).to.be.revertedWith("StudentIdentity: Soulbound tokens cannot be transferred");
        });
    });

    describe("Revocation", function () {
        it("Should allow Admin to revoke (burn) identity", async function () {
            await sbt.safeMint(student.address, "ipfs://metadata-uri");
            await sbt.revoke(0); // Admin llama
            expect(await sbt.balanceOf(student.address)).to.equal(0);
        });
    });
});
