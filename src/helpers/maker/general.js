const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfo, ilks } = require("@defisaver/tokens");
const { getProxy, approve, executeAction, setBalance, addresses } = require("../../utils");
const { getVaultsForUser, getVaultInfo, getMcdManagerAddr, getDsrBalance } = require("./view");

/**
 * Create a MCD vault for sender on his proxy (created if he doesn't have one)
 * @param {string} type ilkLabel
 * @param {number} coll amount of collateral to be supplied (whole number)
 * @param {number} debt amount of DAI to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created vault
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function createMcdVault(type, coll, debt, owner) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    // find coll asset
    const ilkObj = ilks.find(i => i.ilkLabel === type);
    let asset = ilkObj.asset;

    if (asset === "ETH") {
        asset = "WETH";
    }
    const tokenData = getAssetInfo(asset);

    // set coll balance for the user
    await setBalance(tokenData.address, owner, coll);

    // approve coll asset for proxy to pull
    await approve(tokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), tokenData.decimals);
    const amountDai = hre.ethers.utils.parseUnits(debt.toString(), 18);

    const mcdManager = await getMcdManagerAddr();

    // create and execute Recipe
    const createVaultRecipe = new dfs.Recipe("CreateVaultRecipe", [
        new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager),
        new dfs.actions.maker.MakerSupplyAction("$1", amountColl, ilkObj.join, senderAcc.address, mcdManager),
        new dfs.actions.maker.MakerGenerateAction("$1", amountDai, senderAcc.address, mcdManager)
    ]);
    const functionData = createVaultRecipe.encodeForDsProxyCall()[1];

    try {
        await executeAction("RecipeExecutor", functionData, proxy);
    } catch (err) {
        throw new Error(`CreateVaultRecipe = ${err}`);
    }

    // return createdVault object
    const vaultsAfter = await getVaultsForUser(proxy.address, mcdManager);
    const vaultId = vaultsAfter.ids[vaultsAfter.ids.length - 1].toNumber();
    const createdVault = await getVaultInfo(vaultId, mcdManager);

    return createdVault;
}

/**
 * Open an empty MCD Vault
 * @param {string} type ilkLabel
 * @param {string} owner the EOA which will be sending transactions and own the newly created vault
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function openEmptyMcdVault(type, owner) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    // find coll asset
    const ilkObj = ilks.find(i => i.ilkLabel === type);
    let asset = ilkObj.asset;

    if (asset === "ETH") {
        asset = "WETH";
    }

    const mcdManager = await getMcdManagerAddr();

    const action = new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];

    try {
        await executeAction("McdOpen", functionData, proxy);
    } catch (err) {
        throw new Error(`McdOpen = ${err}`);
    }

    // return createdVault object
    const vaultsAfter = await getVaultsForUser(proxy.address, mcdManager);
    const vaultId = vaultsAfter.ids[vaultsAfter.ids.length - 1].toNumber();
    const createdVault = await getVaultInfo(vaultId, mcdManager);

    return createdVault;
}

/**
 * Supply collateral to an existing MCD Vault
 * @param {string} sender the EOA which will be supplying collateral to the vault
 * @param {number} vaultId vault ID
 * @param {number} supplyAmount amount of collateral to be supplied (whole number)
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function mcdSupply(sender, vaultId, supplyAmount) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();

    const vault = await getVaultInfo(vaultId, mcdManager);

    // find coll asset
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);
    let asset = ilkObj.asset;

    if (asset === "ETH") {
        asset = "WETH";
    }
    const tokenData = getAssetInfo(asset);

    // set coll balance for the user
    await setBalance(tokenData.address, sender, supplyAmount);

    // approve coll asset for proxy to pull
    await approve(tokenData.address, proxy.address, sender);

    const amountColl = hre.ethers.utils.parseUnits(supplyAmount.toString(), tokenData.decimals);

    const action = new dfs.actions.maker.MakerSupplyAction(vaultId, amountColl, ilkObj.join, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];

    try {
        await executeAction("McdSupply", functionData, proxy);
    } catch (err) {
        throw new Error(`McdSupply${err}`);
    }

    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);

    return updatedVault;
}

/**
 * Withdraw collateral from an existing MCD Vault
 * @param {string} owner the EOA of the vault owner
 * @param {number} vaultId vault ID
 * @param {number} withdrawAmount amount of collateral to be withdrawn (whole number), -1 for whole coll withdraw
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function mcdWithdraw(owner, vaultId, withdrawAmount) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();

    // find coll asset
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);
    let asset = ilkObj.asset;

    if (asset === "ETH") {
        asset = "WETH";
    }
    const tokenData = getAssetInfo(asset);
    let withdrawAmountWei;

    if (withdrawAmount === -1) {
        withdrawAmountWei = hre.ethers.constants.MaxUint256;
    } else {
        withdrawAmountWei = hre.ethers.utils.parseUnits(withdrawAmount.toString(), tokenData.decimals);
    }

    const action = new dfs.actions.maker.MakerWithdrawAction(vaultId, withdrawAmountWei, ilkObj.join, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];

    try {
        await executeAction("McdWithdraw", functionData, proxy);
    } catch (err) {
        throw new Error(`McdWithdraw = ${err}`);
    }

    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);

    return updatedVault;
}

/**
 * Borrow (generate) DAI from an existing MCD Vault
 * @param {string} owner the EOA of the vault owner
 * @param {number} vaultId vault ID
 * @param {number} borrowAmount amount of DAI to be generated (whole number)
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function mcdBorrow(owner, vaultId, borrowAmount) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    const amountDai = hre.ethers.utils.parseUnits(borrowAmount.toString(), 18);

    const mcdManager = await getMcdManagerAddr();

    const action = new dfs.actions.maker.MakerGenerateAction(vaultId, amountDai, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];

    try {
        await executeAction("McdGenerate", functionData, proxy);
    } catch (err) {
        throw new Error(`McdGenerate = ${err}`);
    }

    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);

    return updatedVault;
}

/**
 * Payback DAI debt of an existing MCD Vault
 * @param {string} sender the EOA of the vault owner
 * @param {number} vaultId vault ID
 * @param {number} paybackAmount amount of DAI to be paid back (whole number), -1 for whole debt payback
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function mcdPayback(sender, vaultId, paybackAmount) {

    // get ethers.Signer object for sender eoa
    const senderAcc = await hre.ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();

    let amountDai;
    const { chainId } = await hre.ethers.provider.getNetwork();
    const daiAddress = addresses[chainId].DAI_ADDR;

    if (paybackAmount === -1) {

        // return updatedVault object
        const vaultInfo = await getVaultInfo(vaultId, mcdManager);
        const debt = vaultInfo.debt;
        const debtFloat = parseFloat(hre.ethers.utils.formatUnits(debt.toString(), 18).toString());

        amountDai = hre.ethers.utils.parseUnits((debtFloat + 1).toString(), 18);

        // set coll balance for the user
        await setBalance(daiAddress, sender, amountDai);
    } else {

        // set coll balance for the user
        await setBalance(daiAddress, sender, paybackAmount);
        amountDai = hre.ethers.utils.parseUnits(paybackAmount.toString(), 18);
    }

    // approve coll asset for proxy to pull
    await approve(daiAddress, proxy.address, sender);

    const action = new dfs.actions.maker.MakerPaybackAction(vaultId, amountDai, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];

    try {
        await executeAction("McdPayback", functionData, proxy);
    } catch (err) {
        throw new Error(`McdPayback = ${err}`);
    }

    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);

    return updatedVault;
}

/**
 * Deposit DAI into Maker DSR
 * @param {string} sender the EOA of the vault owner
 * @param {number} amount amount of DAI to be deposited
 * @returns {number} amount of dai in DSR
 */
async function mcdDsrDeposit(sender, amount) {
    const senderAcc = await hre.ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    const { chainId } = await hre.ethers.provider.getNetwork();
    const daiAddress = addresses[chainId].DAI_ADDR;

    const amountInWei = hre.ethers.utils.parseUnits(amount.toString(), 18);

    await setBalance(daiAddress, senderAcc.address, amount);
    await approve(daiAddress, proxy.address, senderAcc.address);

    const action = new dfs.actions.maker.MakerDsrDepositAction(amountInWei, senderAcc.address);
    const functionData = action.encodeForDsProxyCall()[1];

    await executeAction("McdDsrDeposit", functionData, proxy);

    return getDsrBalance(proxy.address);
}

/**
 * Deposit DAI into Maker DSR
 * @param {string} sender the EOA of the vault owner
 * @param {number} amount amount of DAI to be deposited
 * @returns {number} amount of dai in DSR
 */
async function mcdDsrWithdraw(sender, amount) {
    const senderAcc = await hre.ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);
    const amountInWei = hre.ethers.utils.parseUnits(amount.toString(), 18);

    const action = new dfs.actions.maker.MakerDsrWithdrawAction(amountInWei, senderAcc.address);
    const functionData = action.encodeForDsProxyCall()[1];

    await executeAction("McdDsrWithdraw", functionData, proxy);

    return getDsrBalance(proxy.address);
}

module.exports = {
    createMcdVault,
    openEmptyMcdVault,
    mcdSupply,
    mcdWithdraw,
    mcdBorrow,
    mcdPayback,
    mcdDsrDeposit,
    mcdDsrWithdraw
};
