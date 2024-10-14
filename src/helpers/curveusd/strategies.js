const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { subToStrategy, getSender } = require("../../utils");

const { curveusdControllerAbi } = require("../../abi/curveusd/abis");

const CURVE_USD_ADDRESS = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";

/**
 * Subscribes to CurveUsd Repay Bundle
 * @param {Object} owner eoa or proxy
 * @param {string} controllerAddr address of the curveusd controller
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdRepayBundle(
    owner, controllerAddr, minRatio, targetRatio, proxyAddr, useSafe = true
) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * Subscribes to CurveUsd Boost Bundle
 * @param {Object} owner eoa or proxy
 * @param {string} controllerAddr address of the curveusd controller
 * @param {number} maxRatio ratio over which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdBoostBundle(
    owner, controllerAddr, maxRatio, targetRatio, proxyAddr, useSafe = true
) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * Subscribes to CurveUsd Payback Strategy
 * @param {Object} owner eoa
 * @param {string} addressToPullTokensFrom address to pull crvUsd tokens from
 * @param {string} positionOwner address which holds curve usd position. Zero address defaults to wallet
 * @param {string} controllerAddr address of the curveusd controller
 * @param {number} minHealthRatio below this ratio strategy will trigger
 * @param {number} amountToPayback amount of crvusd to payback
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdPaybackStrategy(
    owner,
    addressToPullTokensFrom,
    positionOwner,
    controllerAddr,
    minHealthRatio,
    amountToPayback,
    proxyAddr,
    useSafe = true
) {
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

    const strategySub = automationSdk.strategySubService.crvUSDEncode.payback(
        proxy.address,
        addressToPullTokensFrom,
        positionOwner,
        amountToPayback.toString(),
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
