const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { subToStrategy, getSender } = require("../../utils");
const abiCoder = new hre.ethers.utils.AbiCoder();

const { curveusdControllerAbi } = require("../../abi/curveusd/abis");

/**
 * Subscribes to CurveUsd Repay Bundle
 * @param {Object} owner eoa or proxy
 * @param {number} bundleId CurveUsdRepay Bundle Id
 * @param {string} controllerAddr address of the curveusd controller
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdRepayBundle(
    owner, bundleId, controllerAddr, minRatio, targetRatio
) {
    const [senderAcc, proxy] = await getSender(owner);
    const triggerData = abiCoder.encode(["address", "address", "uint256", "uint8"], [proxy.address, controllerAddr, hre.ethers.utils.parseUnits(minRatio.toString(), 16).toString(), 1]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [1]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);
    const controllerAddressEncoded = abiCoder.encode(["address"], [controllerAddr]);
    const controllerContract = new hre.ethers.Contract(controllerAddr, curveusdControllerAbi, senderAcc);
    const collateralTokenAddress = await controllerContract.collateral_token();
    const collTokenAddressEncoded = abiCoder.encode(["address"], [collateralTokenAddress]);
    const crvUsdAddressEncoded = abiCoder.encode(["address"], ["0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"]);
    const strategySub = [bundleId, true, [triggerData],
        [controllerAddressEncoded, ratioStateEncoded, targetRatioEncoded, collTokenAddressEncoded, crvUsdAddressEncoded]
    ];
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to CurveUsd Boost Bundle
 * @param {Object} owner eoa or proxy
 * @param {number} bundleId CurveUsdRepay Bundle Id
 * @param {string} controllerAddr address of the curveusd controller
 * @param {number} maxRatio ratio over which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdBoostBundle(
    owner, bundleId, controllerAddr, maxRatio, targetRatio
) {
    const [senderAcc, proxy] = await getSender(owner);
    const triggerData = abiCoder.encode(["address", "address", "uint256", "uint8"], [proxy.address, controllerAddr, hre.ethers.utils.parseUnits(maxRatio.toString(), 16).toString(), 0]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [0]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);
    const controllerAddressEncoded = abiCoder.encode(["address"], [controllerAddr]);
    const controllerContract = new hre.ethers.Contract(controllerAddr, curveusdControllerAbi, senderAcc);
    const collateralTokenAddress = await controllerContract.collateral_token();
    const collTokenAddressEncoded = abiCoder.encode(["address"], [collateralTokenAddress]);
    const crvUsdAddressEncoded = abiCoder.encode(["address"], ["0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"]);
    const strategySub = [bundleId, true, [triggerData],
        [controllerAddressEncoded, ratioStateEncoded, targetRatioEncoded, collTokenAddressEncoded, crvUsdAddressEncoded]
    ];
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
 * @returns {Object} subId and strategySub
 */
async function subCurveUsdPaybackStrategy(
    owner,
    addressToPullTokensFrom,
    positionOwner,
    controllerAddr,
    minHealthRatio,
    amountToPayback
) {
    const [, proxy] = await getSender(owner);

    const curveUsdAddress = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";
    const strategySub = automationSdk.strategySubService.crvUSDEncode.payback(
        proxy.address,
        addressToPullTokensFrom,
        positionOwner,
        amountToPayback.toString(),
        curveUsdAddress,
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
