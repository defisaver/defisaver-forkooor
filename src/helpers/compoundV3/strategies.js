const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, addresses, getLatestSubId } = require("../../utils");
const { compoundV3SubProxyAbi } = require("../../abi/compoundV3/abis");

/**
 * Subscribes to Compound V3 Automation strategy
 * @param {Object} proxy owner's proxy
 * @param {string} strategySub strategySub properly encoded
 * @returns {string} ID of the subscription
 */
async function _subToCompoundV3Automation(proxy, strategySub) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].COMP_V3_SUB_PROXY;

    const [singer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, compoundV3SubProxyAbi, singer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToCompV3Automation",
        [strategySub]
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    }).then(e => e.wait());

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
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3AutomationStrategy(owner, market, baseToken, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, isEOA) {

    try {
        const [, proxy] = await getSender(owner);

        const strategySub = automationSdk.strategySubService.compoundV3Encode.leverageManagement(
            market, baseToken, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled, isEOA
        );

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
