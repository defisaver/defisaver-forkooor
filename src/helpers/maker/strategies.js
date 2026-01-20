const { ilks } = require("@defisaver/tokens");
const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { addresses, subToStrategy, getSender, subToMcdAutomation } = require("../../utils");
const { getVaultInfo, getMcdManagerAddr } = require("../maker/view");


/**
 * Subscribes to MCD Close to Dai strategy
 * @param {number} vaultId ID of the MCD vault
 * @param {number} triggerPrice Price of the asset for which price we're checking (whole number)
 * @param {string} triggerState OVER/UNDER
 * @param {string} eoa EOA of the Vault owner
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToDaiStrategy(vaultId, triggerPrice, triggerState, eoa, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

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
 * @param {string} eoa EOA of the Vault owner
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToCollStrategy(vaultId, triggerPrice, triggerState, eoa, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

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
 * @param {string} eoa EOA of the Vault owner
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMCDSmartSavingsRepayStrategy(vaultId, protocol, minRatio, targetRatio, eoa, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

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
 * @param {string} eoa EOA of the Vault owner
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} maxRatio ratio over which the strategy will trigger
 * @param {number} targetRepayRatio wanted ratio after repay
 * @param {number} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdAutomationStrategy(vaultId, eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, proxyAddr, useSafe = true) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const strategySub = automationSdk.strategySubService.makerEncode.leverageManagement(
            vaultId, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
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
