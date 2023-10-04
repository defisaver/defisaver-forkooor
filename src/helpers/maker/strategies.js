const { ilks } = require("@defisaver/tokens");
const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getProxy, addresses, subToStrategy, getSender, subToMcdAutomation} = require("../../utils");
const { getVaultInfo, getMcdManagerAddr } = require("../maker/view");


/**
 * Subscribes to MCD Close to Dai strategy
 * @param {number} vaultId ID of the MCD vault
 * @param {number} triggerPrice Price of the asset for which price we're checking (whole number)
 * @param {string} triggerState OVER/UNDER
 * @param {string} owner EOA of the Vault owner
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToDaiStrategy(vaultId, triggerPrice, triggerState, owner) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);

    let formattedPriceState;

    if (triggerState.toLowerCase() === "over") {
        formattedPriceState = 0;
    } else if (triggerState.toLowerCase() === "under") {
        formattedPriceState = 1;
    }
    const mcdManager = await getMcdManagerAddr();
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);

    const { chainId } = await hre.ethers.provider.getNetwork();
    const daiAddress = addresses[chainId].DAI_ADDR;

    const strategySub = automationSdk.strategySubService.makerEncode.closeOnPrice(
        vaultId, formattedPriceState, triggerPrice.toString(), daiAddress, ilkObj.assetAddress
    );
    const subId = await subToStrategy(proxy, strategySub);


    return { strategySub, subId };
}

/**
 * Subscribes to MCD Close to Coll strategy
 * @param {number} vaultId ID of the MCD vault
 * @param {number} triggerPrice Price of the asset for which price we're checking (whole number)
 * @param {string} triggerState OVER/UNDER
 * @param {string} owner EOA of the Vault owner
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToCollStrategy(vaultId, triggerPrice, triggerState, owner) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);

    let formattedPriceState;

    if (triggerState.toLowerCase() === "over") {
        formattedPriceState = 0;
    } else if (triggerState.toLowerCase() === "under") {
        formattedPriceState = 1;
    }
    const mcdManager = await getMcdManagerAddr();
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);


    const strategySub = automationSdk.strategySubService.makerEncode.closeOnPrice(
        vaultId, formattedPriceState, triggerPrice.toString(), ilkObj.assetAddress, ilkObj.assetAddress
    );
    const subId = await subToStrategy(proxy, strategySub);


    return { strategySub, subId };
}

/**
 * Subscribe to MCD Repay from smart savings strategy
 * @param {number} vaultId ID of the MCD vault
 * @param {string} protocol yearn/mstable/rari
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio wanted ratio after execution
 * @param {string} owner EOA of the Vault owner
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMCDSmartSavingsRepayStrategy(vaultId, protocol, minRatio, targetRatio, owner) {

    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);

    let bundleId;

    if (protocol.toLowerCase() === "yearn") {
        bundleId = 0;
    }

    if (protocol.toLowerCase() === "mstable") {
        bundleId = 1;
    }

    if (protocol.toLowerCase() === "rari") {
        bundleId = 2;
    }


    const strategySub = automationSdk.strategySubService.makerEncode.repayFromSavings(bundleId, vaultId, minRatio, targetRatio);

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MCD Automation strategy
 * @param {number} vaultId ID of the MCD vault
 * @param {string} owner EOA of the Vault owner
 * @param {string} minRatio ratio under which the strategy will trigger
 * @param {string} maxRatio ratio over which the strategy will trigger
 * @param {string} targetRepayRatio wanted ratio after repay
 * @param {string} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subMcdAutomationStrategy(vaultId, owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled) {

    try {
        const [, proxy] = await getSender(owner);

        const strategySub = automationSdk.strategySubService.makerEncode.leverageManagement(
            vaultId, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled
        );

        const subId = await subToMcdAutomation(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}


module.exports = {
    subMcdCloseToDaiStrategy,
    subMcdCloseToCollStrategy,
    subMCDSmartSavingsRepayStrategy,
    subMcdAutomationStrategy
};
