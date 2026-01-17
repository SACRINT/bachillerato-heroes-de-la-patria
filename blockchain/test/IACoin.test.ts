import { expect } from "chai";
import { ethers } from "hardhat";
import { IACoin } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("IACoin Token", function () {
    let iacoin: IACoin;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;

    // Roles en bytes32
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const IACoinFactory = await ethers.getContractFactory("IACoin");
        iacoin = await IACoinFactory.deploy();
        await iacoin.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should accept correct name and symbol", async function () {
            expect(await iacoin.name()).to.equal("IACoin");
            expect(await iacoin.symbol()).to.equal("IAC");
        });

        it("Should grant roles to deployer", async function () {
            expect(await iacoin.hasRole(MINTER_ROLE, owner.address)).to.be.true;
            expect(await iacoin.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("Should mint tokens if caller has MINTER_ROLE", async function () {
            await iacoin.mint(addr1.address, 1000);
            expect(await iacoin.balanceOf(addr1.address)).to.equal(1000);
        });

        it("Should fail to mint if caller does not have MINTER_ROLE", async function () {
            await expect(
                iacoin.connect(addr1).mint(addr1.address, 1000)
            ).to.be.revertedWithCustomError(iacoin, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            await iacoin.mint(owner.address, 1000);
            await iacoin.transfer(addr1.address, 500);

            expect(await iacoin.balanceOf(owner.address)).to.equal(500);
            expect(await iacoin.balanceOf(addr1.address)).to.equal(500);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            await expect(
                iacoin.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWithCustomError(iacoin, "ERC20InsufficientBalance");
        });
    });

    describe("Pausable", function () {
        it("Should pause and unpause transfers", async function () {
            await iacoin.mint(owner.address, 1000);
            await iacoin.pause();

            await expect(
                iacoin.transfer(addr1.address, 100)
            ).to.be.revertedWithCustomError(iacoin, "EnforcedPause");

            await iacoin.unpause();
            await iacoin.transfer(addr1.address, 100);
            expect(await iacoin.balanceOf(addr1.address)).to.equal(100);
        });
    });

    describe("Burning", function () {
        it("Should burn tokens", async function () {
            await iacoin.mint(owner.address, 1000);
            await iacoin.burn(500);
            expect(await iacoin.balanceOf(owner.address)).to.equal(500);
        });
    });
});
