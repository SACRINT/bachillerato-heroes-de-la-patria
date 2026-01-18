import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Semana 38: Security Audit Tests para contratos DeFi
 */
describe("DeFi Security Suite", function () {
    let deployer: SignerWithAddress;
    let oracle: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let attacker: SignerWithAddress;

    let iaCoin: any;
    let studyStaking: any;
    let schoolAssets: any;
    let marketplace: any;
    let scholarshipManager: any;

    const INITIAL_SUPPLY = ethers.parseEther("1000000");

    beforeEach(async function () {
        [deployer, oracle, user1, user2, attacker] = await ethers.getSigners();

        // Deploy IACoin
        const IACoin = await ethers.getContractFactory("IACoin");
        iaCoin = await IACoin.deploy();
        await iaCoin.waitForDeployment();

        // Mint initial supply
        await iaCoin.mint(deployer.address, INITIAL_SUPPLY);

        // Deploy StudyStaking
        const StudyStaking = await ethers.getContractFactory("StudyStaking");
        studyStaking = await StudyStaking.deploy(await iaCoin.getAddress());
        await studyStaking.waitForDeployment();

        // Deploy SchoolAssets
        const SchoolAssets = await ethers.getContractFactory("SchoolAssets");
        schoolAssets = await SchoolAssets.deploy("https://api.bge.edu/assets/", deployer.address);
        await schoolAssets.waitForDeployment();

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("SchoolMarketplace");
        marketplace = await Marketplace.deploy(
            await iaCoin.getAddress(),
            await schoolAssets.getAddress(),
            deployer.address // treasury
        );
        await marketplace.waitForDeployment();

        // Deploy ScholarshipManager
        const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
        scholarshipManager = await ScholarshipManager.deploy(await iaCoin.getAddress());
        await scholarshipManager.waitForDeployment();

        // Setup roles
        const ORACLE_ROLE = await studyStaking.ORACLE_ROLE();
        await studyStaking.grantRole(ORACLE_ROLE, oracle.address);

        // Fund users
        await iaCoin.transfer(user1.address, ethers.parseEther("1000"));
        await iaCoin.transfer(user2.address, ethers.parseEther("1000"));
    });

    describe("StudyStaking Security", function () {
        it("Should prevent staking 0 tokens", async function () {
            await expect(studyStaking.connect(user1).stake(0)).to.be.revertedWith("Cannot stake 0");
        });

        it("Should apply penalty for early withdrawal", async function () {
            const stakeAmount = ethers.parseEther("100");

            await iaCoin.connect(user1).approve(await studyStaking.getAddress(), stakeAmount);
            await studyStaking.connect(user1).stake(stakeAmount);

            // Withdraw immediately (before lock period)
            const balanceBefore = await iaCoin.balanceOf(user1.address);
            await studyStaking.connect(user1).withdraw(stakeAmount);
            const balanceAfter = await iaCoin.balanceOf(user1.address);

            // Should receive 90% (10% penalty)
            const received = balanceAfter - balanceBefore;
            expect(received).to.equal(ethers.parseEther("90"));
        });

        it("Should prevent unauthorized grade updates", async function () {
            await expect(
                studyStaking.connect(attacker).updateGradeBonus(user1.address, 95)
            ).to.be.reverted;
        });

        it("Should calculate correct APY with grade bonus", async function () {
            // Base APY is 500 (5%)
            // Update grade to 95 (9.5 average) -> bonus = (95-80) * 50 = 750 basis points
            await studyStaking.connect(oracle).updateGradeBonus(user1.address, 95);

            const effectiveAPY = await studyStaking.getEffectiveAPY(user1.address);
            expect(effectiveAPY).to.equal(1250); // 500 + 750 = 12.5%
        });
    });

    describe("Marketplace Security", function () {
        beforeEach(async function () {
            // Create an item
            await schoolAssets.createItem("Test Item", 0, 0, 100, true, "");

            // Mint to user1
            const MINTER_ROLE = await schoolAssets.MINTER_ROLE();
            await schoolAssets.grantRole(MINTER_ROLE, deployer.address);
            await schoolAssets.mint(user1.address, 1, 10);

            // Approve marketplace
            await schoolAssets.connect(user1).setApprovalForAll(await marketplace.getAddress(), true);
        });

        it("Should prevent buying own listing", async function () {
            await marketplace.connect(user1).listItem(1, 5, ethers.parseEther("10"));

            await iaCoin.connect(user1).approve(await marketplace.getAddress(), ethers.parseEther("50"));

            await expect(
                marketplace.connect(user1).buyItem(1, 1)
            ).to.be.revertedWith("Cannot buy own listing");
        });

        it("Should correctly transfer funds with fee", async function () {
            const price = ethers.parseEther("100");

            await marketplace.connect(user1).listItem(1, 1, price);

            const sellerBalanceBefore = await iaCoin.balanceOf(user1.address);
            const treasuryBalanceBefore = await iaCoin.balanceOf(deployer.address);

            await iaCoin.connect(user2).approve(await marketplace.getAddress(), price);
            await marketplace.connect(user2).buyItem(1, 1);

            const sellerBalanceAfter = await iaCoin.balanceOf(user1.address);
            const treasuryBalanceAfter = await iaCoin.balanceOf(deployer.address);

            // Seller gets 97.5% (2.5% fee)
            expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ethers.parseEther("97.5"));
            // Treasury gets 2.5%
            expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(ethers.parseEther("2.5"));
        });

        it("Should prevent double-spending of listed items", async function () {
            await marketplace.connect(user1).listItem(1, 5, ethers.parseEther("10"));

            // user2 buys all 5
            await iaCoin.connect(user2).approve(await marketplace.getAddress(), ethers.parseEther("100"));
            await marketplace.connect(user2).buyItem(1, 5);

            // Trying to buy more should fail
            await expect(
                marketplace.connect(user2).buyItem(1, 1)
            ).to.be.revertedWith("Listing not active");
        });
    });

    describe("Scholarship Security", function () {
        beforeEach(async function () {
            // Fund scholarship pool
            await iaCoin.approve(await scholarshipManager.getAddress(), ethers.parseEther("10000"));
            await scholarshipManager.donate(ethers.parseEther("10000"));
        });

        it("Should prevent unauthorized approval", async function () {
            await scholarshipManager.connect(user1).applyForScholarship(0, ethers.parseEther("100"), 6);

            await expect(
                scholarshipManager.connect(attacker).approveScholarship(1, 90)
            ).to.be.reverted;
        });

        it("Should revoke scholarship if grade drops", async function () {
            await scholarshipManager.connect(user1).applyForScholarship(0, ethers.parseEther("100"), 6);

            const ADMIN_ROLE = await scholarshipManager.ADMIN_ROLE();
            await scholarshipManager.grantRole(ADMIN_ROLE, deployer.address);
            await scholarshipManager.approveScholarship(1, 90);
            await scholarshipManager.activateScholarship(1);

            // Update grade to failing (below 80 = auto revoke threshold)
            const ORACLE_ROLE = await scholarshipManager.ORACLE_ROLE();
            await scholarshipManager.grantRole(ORACLE_ROLE, oracle.address);
            await scholarshipManager.connect(oracle).updateStudentGrade(1, 75);

            const scholarship = await scholarshipManager.getScholarshipDetails(1);
            expect(scholarship.status).to.equal(3); // REVOKED
        });
    });

    describe("Pausable System", function () {
        it("Should prevent staking when paused", async function () {
            await studyStaking.pause();

            await iaCoin.connect(user1).approve(await studyStaking.getAddress(), ethers.parseEther("100"));

            await expect(
                studyStaking.connect(user1).stake(ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(studyStaking, "EnforcedPause");
        });

        it("Should prevent marketplace listing when paused", async function () {
            await marketplace.pause();

            await expect(
                marketplace.connect(user1).listItem(1, 1, ethers.parseEther("10"))
            ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
        });
    });
});
