const hre = require("hardhat");
const { curveusdViewAbi } = require("../../abi/curveusd/abis");
const { addresses } = require("../../utils");

/**
 * returns CurveUsd position info
 * @param {string} controller address of the Curve controller
 * @param {string} user address of curve user
 * @returns {Object} object that has curveusd position info
 */
async function getUserData(controller, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();

    const viewAddress = addresses[chainId].CURVE_USD_VIEW;
    const view = new hre.ethers.Contract(viewAddress, curveusdViewAbi, signer);
    const userData = await view.userData(controller, user);

    return {
        ownerAddr: user,
        loanExists: userData.loanExists,
        collateralPrice: userData.collateralPrice.toString(),
        marketCollateralAmount: userData.marketCollateralAmount.toString(),
        curveUsdCollateralAmount: userData.curveUsdCollateralAmount.toString(),
        debtAmount: userData.debtAmount.toString(),
        N: userData.N.toString(),
        priceLow: userData.priceLow.toString(),
        priceHigh: userData.priceHigh.toString(),
        liquidationDiscount: userData.liquidationDiscount.toString(),
        health: userData.health.toString(),
        bandRange: userData.bandRange,
        usersBands: userData.usersBands,
        collRatio: userData.collRatio.toString(),
        isInSoftLiquidation: userData.isInSoftLiquidation
    };
}

module.exports = {
    getUserData
};
