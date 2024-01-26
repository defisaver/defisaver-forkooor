const hre = require("hardhat");
const { morphoBlueViewAbi } = require("../../abi/morpho-blue/abis");


const morphoBlueView = {
    address: "0xE29175a86B60138403a9534A391acaDb19f1E9a6",
    abi: morphoBlueViewAbi
};

/**
 * returns MorphoBlue position info
 * @param {string} marketParams array of market params, [loanToken, collateralToken, oracle, irm, lltv]
 * @param {string} user address of curve user
 * @returns {Object} object that has curveusd position info
 */
async function getUserData(marketParams, user) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(morphoBlueView.address, morphoBlueView.abi, signer);
    const userData = await view.callStatic.getUserInfo(marketParams, user);

    return {
        supplyShares: userData.supplyShares.toString(),
        suppliedInAssets: userData.suppliedInAssets.toString(),
        borrowShares: userData.borrowShares.toString(),
        borrowedInAssets: userData.borrowedInAssets.toString(),
        collateral: userData.collateral.toString()
    };
}

/**
 * returns MorphoBlue market id from params
 * @param {Object} marketParams params of the morphoBlue market
 * @returns {string} marketId
 */
async function getMarketId(marketParams) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(morphoBlueView.address, morphoBlueView.abi, signer);
    const marketId = await view.getMarketId(marketParams);

    return marketId;
}

module.exports = {
    getUserData,
    getMarketId
};
