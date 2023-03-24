const hre = require('hardhat');
const dfs = require('@defisaver/sdk');
const { getAssetInfo, ilks } = require('@defisaver/tokens');
const { getAddrFromRegistry, getProxy, approve, executeAction } = require('../../utils');
const { setBalance, topUpAccount } = require('../utils/general');
const { getVaultsForUser, getVaultInfo, getMcdManagerAddr, DAI_ADDR } = require('./view');


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

    // create and execute Recipe 
    const createVaultRecipe = new dfs.Recipe('CreateVaultRecipe', [
        new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager),
        new dfs.actions.maker.MakerSupplyAction('$1', amountColl, ilkObj.join, senderAcc.address, mcdManager),
        new dfs.actions.maker.MakerGenerateAction('$1', amountDai, senderAcc.address, mcdManager),
    ]);
    const functionData = createVaultRecipe.encodeForDsProxyCall();
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

    const mcdManager = await getMcdManagerAddr();
    
    const action = new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];
    try {
        await executeAction('McdOpen', functionData, proxy)
    } catch (err) {
        throw new Error("McdOpen");
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
    
    const action = new dfs.actions.maker.MakerSupplyAction(vaultId, amountColl, ilkObj.join, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];
    try {
        await executeAction('McdSupply', functionData, proxy)
    } catch (err) {
        throw new Error("McdSupply");
    }
    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);
    return updatedVault;
}

const mcdWithdraw = async (forkId, owner, vaultId, withdrawAmount) => {
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, owner, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(owner.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();
    // find coll asset
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find((i) => i.ilkLabel === vault.ilkLabel);
    let asset = ilkObj.asset;
    if (asset === 'ETH') asset = 'WETH';
    const tokenData = getAssetInfo(asset);
    
    if (withdrawAmount == -1){
        withdrawAmount = hre.ethers.constants.MaxUint256;
    } else {
        withdrawAmount = hre.ethers.utils.parseUnits(withdrawAmount.toString(), tokenData.decimals);
    }

    const action = new dfs.actions.maker.MakerWithdrawAction(vaultId, withdrawAmount, ilkObj.join, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];
    try {
        await executeAction('McdWithdraw', functionData, proxy)
    } catch (err) {
        throw new Error("McdWithdraw");
    }
    // return updatedVault object
    const updatedVault = await getVaultInfo(vaultId, mcdManager);
    return updatedVault;
}

const mcdBorrow = async (forkId, owner, vaultId, borrowAmount) => {
    
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, owner, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(owner.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    const amountDai = hre.ethers.utils.parseUnits(borrowAmount.toString(), 18);

    const mcdManager = await getMcdManagerAddr();

    const action = new dfs.actions.maker.MakerGenerateAction(vaultId, amountDai, senderAcc.address, mcdManager);
    const functionData = action.encodeForDsProxyCall()[1];
    try {
        await executeAction('McdGenerate', functionData, proxy)
    } catch (err) {
        throw new Error("McdGenerate");
    }

   // return updatedVault object
   const updatedVault = await getVaultInfo(vaultId, mcdManager);
   return updatedVault;
};

const mcdPayback = async (forkId, owner, vaultId, paybackAmount) => {
    
    // top up sender account so it has eth balance to pay for transactions
    await topUpAccount(forkId, owner, 100);

    // get ethers.Signer object for sender eoa
    senderAcc = await hre.ethers.provider.getSigner(owner.toString());
    senderAcc.address = senderAcc._address;
    // create Proxy if the sender doesn't already have one
    let proxy = await getProxy(senderAcc.address);

    const mcdManager = await getMcdManagerAddr();
    
    let amountDai;
    if (paybackAmount == -1){
        // return updatedVault object
        const vaultInfo = await getVaultInfo(vaultId, mcdManager);
        const debt = vaultInfo.debt;
        const debtFloat = parseFloat(hre.ethers.utils.formatUnits(debt.toString(), 18).toString());
        amountDai = hre.ethers.utils.parseUnits((debtFloat + 1).toString(), 18);
        // set coll balance for the user
        await setBalance(forkId, DAI_ADDR, owner, amountDai);
    } else {
        // set coll balance for the user
        await setBalance(forkId, DAI_ADDR, owner, paybackAmount);
        amountDai = hre.ethers.utils.parseUnits(paybackAmount.toString(), 18);
        
    }

    // approve coll asset for proxy to pull
    await approve(DAI_ADDR, proxy.address, owner);

    
    const action = new dfs.actions.maker.MakerPaybackAction(vaultId, amountDai, senderAcc.address, mcdManager)
    const functionData = action.encodeForDsProxyCall()[1];
    try {
        await executeAction('McdPayback', functionData, proxy)
    } catch (err) {
        throw new Error("McdPayback");
    }

   // return updatedVault object
   const updatedVault = await getVaultInfo(vaultId, mcdManager);
   return updatedVault;
};



module.exports = {
    createMcdVault,
    openEmptyMcdVault,
    mcdSupply,
    mcdWithdraw,
    mcdBorrow,
    mcdPayback,
}