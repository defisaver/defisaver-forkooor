const hre = require("hardhat");
const { morphoBlueViewAbi } = require("../../abi/morpho-blue/abis");
const { addresses } = require("../../utils");
const { configure } = require("@defisaver/sdk");

/**
 * returns MorphoBlue position info
 * @param {string} marketParams array of market params, [loanToken, collateralToken, oracle, irm, lltv]
 * @param {string} user address of morphoBlue user
 * @returns {Object} object that has morphoBlue position info
 */
async function getUserData(marketParams, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();

    configure({
        chainId,
        testMode: false
    });

    const morphoBlueViewAddress = addresses[chainId].MORPHO_BLUE_VIEW;

    const view = new hre.ethers.Contract(morphoBlueViewAddress, morphoBlueViewAbi, signer);
    const userData = await view.callStatic.getUserInfo(marketParams, user);

    return {
        supplyShares: userData.supplyShares.toString(),
        suppliedInAssets: userData.suppliedInAssets.toString(),
        borrowShares: userData.borrowShares.toString(),
        borrowedInAssets: userData.borrowedInAssets.toString(),
        collateral: userData.collateral.toString(),
        user
    };
}

/**
 * returns MorphoBlue market id from params
 * @param {Object} marketParams params of the morphoBlue market
 * @returns {string} marketId
 */
async function getMarketId(marketParams) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();

    const morphoBlueViewAddress = addresses[chainId].MORPHO_BLUE_VIEW;

    const view = new hre.ethers.Contract(morphoBlueViewAddress, morphoBlueViewAbi, signer);
    const marketId = await view.getMarketId(marketParams);

    return marketId;
}

module.exports = {
    getUserData,
    getMarketId
};
