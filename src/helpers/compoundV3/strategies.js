const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, addresses, getLatestSubId, executeActionFromProxy } = require("../../utils");
const { compoundV3SubProxyAbi } = require("../../abi/compoundV3/abis");
const { compoundV3SubProxyL2Abi } = require("../../abi/compoundV3/abis");

/**
 * Helper method for getting compound sub proxy contract
 * @returns {Object} subProxyAddr and subProxy
 */
async function getSubProxyContract() {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const [singer] = await hre.ethers.getSigners();
    const subProxyAddr = addresses[chainId].COMP_V3_SUB_PROXY;
    const subProxyAbi = chainId === 1 ? compoundV3SubProxyAbi : compoundV3SubProxyL2Abi;

    return {
        subProxyAddr,
        subProxy: new hre.ethers.Contract(subProxyAddr, subProxyAbi, singer)
    };
}

/**
 * Subscribes to Compound V3 Automation strategy
 * @param {Object} proxy owner's proxy
 * @param {string} strategySub strategySub properly encoded
 * @returns {string} ID of the subscription
 */
async function _subToCompoundV3Automation(proxy, strategySub) {
    const { subProxyAddr, subProxy } = await getSubProxyContract();

    const functionData = subProxy.interface.encodeFunctionData(
        "subToCompV3Automation",
        [strategySub]
    );

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribes to Compound V3 Automation strategy
 * @param {string} owner proxy owner
 * @param {string} market compoundV3 market address
 * @param {string} baseToken market base token address
 * @param {int} minRatio ratio under which the strategy will trigger
 * @param {int} maxRatio ratio over which the strategy will trigger
 * @param {int} targetRepayRatio wanted ratio after repay
 * @param {int} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @param {boolean} isEOA is EOA subscription
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3AutomationStrategy(
    owner,
    market,
    baseToken,
    minRatio,
    maxRatio,
    targetRepayRatio,
    targetBoostRatio,
    boostEnabled,
    isEOA,
    proxyAddr,
    useSafe = true
) {

    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

        const { chainId } = await hre.ethers.provider.getNetwork();

        let strategySub;

        if (chainId === 1) {
            strategySub = automationSdk.strategySubService.compoundV3Encode.leverageManagement(
                market, baseToken, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled, isEOA
            );
        } else {
            strategySub = automationSdk.strategySubService.compoundV3L2Encode.leverageManagement(
                market, baseToken, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
            );
        }

        const subId = await _subToCompoundV3Automation(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subCompoundV3AutomationStrategy
};
