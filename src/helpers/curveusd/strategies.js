const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { subToStrategy, getSender } = require("../../utils");

const { curveusdControllerAbi } = require("../../abi/curveusd/abis");

const CURVE_USD_ADDRESS = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";

/**
 * Subscribes to CurveUSD Repay Bundle
 * @param {string} eoa The EOA which will be sending transactions
 * @param {string} controllerAddr Address of the CurveUSD controller
 * @param {number} minRatio Ratio under which the strategy will trigger
 * @param {number} targetRatio Target ratio to achieve after strategy execution
 * @param {string} proxyAddr Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCurveUsdRepayBundle(
    eoa, controllerAddr, minRatio, targetRatio, proxyAddr, useSafe = true
) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    const controllerContract = new hre.ethers.Contract(controllerAddr, curveusdControllerAbi, senderAcc);
    const collateralToken = await controllerContract.collateral_token();

    const strategySub = automationSdk.strategySubService.crvUSDEncode.leverageManagement(
        proxy.address,
        controllerAddr,
        1, // ratio state = under
        targetRatio,
        minRatio,
        collateralToken,
        CURVE_USD_ADDRESS
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to CurveUSD Boost Bundle
 * @param {string} eoa The EOA which will be sending transactions
 * @param {string} controllerAddr Address of the CurveUSD controller
 * @param {number} maxRatio Ratio over which the strategy will trigger
 * @param {number} targetRatio Target ratio to achieve after strategy execution
 * @param {string} proxyAddr Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCurveUsdBoostBundle(
    eoa, controllerAddr, maxRatio, targetRatio, proxyAddr, useSafe = true
) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    const controllerContract = new hre.ethers.Contract(controllerAddr, curveusdControllerAbi, senderAcc);
    const collateralToken = await controllerContract.collateral_token();

    const strategySub = automationSdk.strategySubService.crvUSDEncode.leverageManagement(
        proxy.address,
        controllerAddr,
        0, // ratio state = over
        targetRatio,
        maxRatio,
        collateralToken,
        CURVE_USD_ADDRESS
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to CurveUSD Payback Strategy
 * @param {string} eoa The EOA which will be sending transactions
 * @param {string} addressToPullTokensFrom Address to pull crvUSD tokens from
 * @param {string} positionOwner Address which holds CurveUSD position. Zero address defaults to wallet
 * @param {string} controllerAddr Address of the CurveUSD controller
 * @param {number} minHealthRatio Below this ratio strategy will trigger
 * @param {number} amountToPayback Amount of crvUSD to payback in token units (supports decimals, e.g. 20000.5)
 * @param {string} proxyAddr Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCurveUsdPaybackStrategy(
    eoa,
    addressToPullTokensFrom,
    positionOwner,
    controllerAddr,
    minHealthRatio,
    amountToPayback,
    proxyAddr,
    useSafe = true
) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

    const amountToPaybackScaled = hre.ethers.utils.parseUnits(amountToPayback.toString(), 18);

    const strategySub = automationSdk.strategySubService.crvUSDEncode.payback(
        proxy.address,
        addressToPullTokensFrom,
        positionOwner,
        amountToPaybackScaled.toString(),
        CURVE_USD_ADDRESS,
        controllerAddr,
        minHealthRatio
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subCurveUsdRepayBundle,
    subCurveUsdBoostBundle,
    subCurveUsdPaybackStrategy
};
