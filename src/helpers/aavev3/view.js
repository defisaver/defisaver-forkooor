const hre = require("hardhat");
const { aaveV3ViewAbi } = require("../../abi/aaveV3/abis");
const { addresses } = require("../../utils");

/**
 * returns market data for a list of tokens
 * @param {string} market address of the Aave market
 * @param {string[]} assets array of asset addresses
 * @returns {Object} object that has market data for each token used as input
 */
async function getFullTokensInfo(market, assets) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewAddress = addresses[chainId].AAVE_V3_VIEW;
    const viewContract = new hre.ethers.Contract(viewAddress, aaveV3ViewAbi, signer);

    return await viewContract.getFullTokensInfo(market, assets);
}

/**
 * return data about a particular users position in Aave
 * @param {string} market address of aave market
 * @param {string} user address of the user
 * @returns {Object} information about users position from view contract
 */
async function getLoanData(market, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewAddress = addresses[chainId].AAVE_V3_VIEW;
    const viewContract = new hre.ethers.Contract(viewAddress, aaveV3ViewAbi, signer);

    const loanData = await viewContract.getLoanData(market, user);

    return {
        user: loanData.user,
        ratio: loanData.ratio.toString(),
        eMode: loanData.eMode.toString(),
        collAddr: loanData.collAddr,
        borrowAddr: loanData.borrowAddr,
        collAmounts: loanData.collAmounts.map(amount => amount.toString()),
        borrowStableAmounts: loanData.borrowStableAmounts.map(amount =>
            amount.toString()),
        borrowVariableAmounts: loanData.borrowVariableAmounts.map(amount =>
            amount.toString()),
        ltv: loanData.ltv,
        liquidationThreshold: loanData.liquidationThreshold,
        liquidationBonus: loanData.liquidationBonus,
        priceSource: loanData.priceSource,
        label: loanData.label
    };
}

/**
 * Return data about a particular users safety ratio on AaveV3 market
 * @param {string} market address of aave market
 * @param {string} user address of the user
 * @returns {Object} information about users safety ratio
 */
async function getSafetyRatio(market, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewAddress = addresses[chainId].AAVE_V3_VIEW;
    const viewContract = new hre.ethers.Contract(viewAddress, aaveV3ViewAbi, signer);

    const safetyRatio = await viewContract.getSafetyRatio(market, user);

    return {
        ratio: safetyRatio.toString()
    };
}

module.exports = {
    getFullTokensInfo,
    getLoanData,
    getSafetyRatio
};
