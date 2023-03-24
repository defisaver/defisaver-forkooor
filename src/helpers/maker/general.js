const hre = require('hardhat');
const dfs = require('@defisaver/sdk');
const { getAssetInfo, ilks } = require('@defisaver/tokens');
const { getAddrFromRegistry, getProxy, approve } = require('../../utils');
const { setBalance, topUpAccount } = require('../utils/general');
const { getVaultsForUser, getVaultInfo, getMcdManagerAddr } = require('./view');


// creates a MCD vault for sender on his proxy (created if he doesn't have one)
const createMcdVault = async (forkId, type, coll, debt, sender) => {
    
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, sender, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(sender.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    // find coll asset
    const ilkObj = ilks.find((i) => i.ilkLabel === type);
    let asset = ilkObj.asset;
    if (asset === 'ETH') asset = 'WETH';
    const tokenData = getAssetInfo(asset);

    // set coll balance for the user
    await setBalance(forkId, tokenData.address, sender, coll);

    // approve coll asset for proxy to pull
    await approve(tokenData.address, proxy.address, sender);

    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), tokenData.decimals);
    const amountDai = hre.ethers.utils.parseUnits(debt.toString(), 18);

    const mcdManager = await getMcdManagerAddr();

    // create Recipe 
    const createVaultRecipe = new dfs.Recipe('CreateVaultRecipe', [
        new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager),
        new dfs.actions.maker.MakerSupplyAction('$1', amountColl, ilkObj.join, senderAcc.address, mcdManager),
        new dfs.actions.maker.MakerGenerateAction('$1', amountDai, senderAcc.address, mcdManager),
    ]);
    const functionData = createVaultRecipe.encodeForDsProxyCall();

    // execute Recipe
    try {
        const recipeExecutorAddr = await getAddrFromRegistry('RecipeExecutor');
        await proxy['execute(address,bytes)'](recipeExecutorAddr, functionData[1], { gasLimit: 3000000 });
    } catch (err) {
        throw new Error("Vault creation recipe failed");
    }

    // return createdVault object
    const vaultsAfter = await getVaultsForUser(proxy.address ,mcdManager);
    const vaultId = vaultsAfter.ids[vaultsAfter.ids.length - 1].toNumber();
    const createdVault = await getVaultInfo(vaultId, mcdManager);
    return createdVault;
};

// open an empty MCD vault for a given ilk
const openEmptyMcdVault = async(forkId, type, sender) => {
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, sender, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(sender.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    // find coll asset
    const ilkObj = ilks.find((i) => i.ilkLabel === type);
    let asset = ilkObj.asset;
    if (asset === 'ETH') asset = 'WETH';
    const tokenData = getAssetInfo(asset);


    const mcdManager = await getMcdManagerAddr();

    // create Recipe 
    const createVaultRecipe = new dfs.Recipe('CreateEmptyVaultRecipe', [
        new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager),
    ]);
    const functionData = createVaultRecipe.encodeForDsProxyCall();

    // execute Recipe
    try {
        const recipeExecutorAddr = await getAddrFromRegistry('RecipeExecutor');
        await proxy['execute(address,bytes)'](recipeExecutorAddr, functionData[1], { gasLimit: 3000000 });
    } catch (err) {
        throw new Error("Vault creation recipe failed");
    }

    // return createdVault object
    const vaultsAfter = await getVaultsForUser(proxy.address ,mcdManager);
    const vaultId = vaultsAfter.ids[vaultsAfter.ids.length - 1].toNumber();
    const createdVault = await getVaultInfo(vaultId, mcdManager);
    return createdVault;
}

const mcdSupply = async (forkId, sender, vaultId, supplyAmount) => {
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, sender, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(sender.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();

    const vault = await getVaultInfo(vaultId, mcdManager);
    // find coll asset
    const ilkObj = ilks.find((i) => i.ilkLabel === vault.ilkLabel);
    let asset = ilkObj.asset;
    if (asset === 'ETH') asset = 'WETH';
    const tokenData = getAssetInfo(asset);

    // set coll balance for the user
    await setBalance(forkId, tokenData.address, sender, supplyAmount);

    // approve coll asset for proxy to pull
    await approve(tokenData.address, proxy.address, sender);

    const amountColl = hre.ethers.utils.parseUnits(supplyAmount.toString(), tokenData.decimals);
    // create Recipe 
    const createVaultRecipe = new dfs.Recipe('SupplyRecipe', [
        new dfs.actions.maker.MakerSupplyAction(vaultId, amountColl, ilkObj.join, senderAcc.address, mcdManager),
    ]);
    const functionData = createVaultRecipe.encodeForDsProxyCall();

    // execute Recipe
    try {
        const recipeExecutorAddr = await getAddrFromRegistry('RecipeExecutor');
        await proxy['execute(address,bytes)'](recipeExecutorAddr, functionData[1], { gasLimit: 3000000 });
    } catch (err) {
        throw new Error("Vault supply recipe failed");
    }

    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);
    return updatedVault;
}

module.exports = {
    createMcdVault,
    openEmptyMcdVault,
    mcdSupply
}