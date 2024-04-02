const hre = require("hardhat");
const { aaveV3ViewAbi } = require("../../abi/aaveV3/abis");


const aaveView = {
    address: "0x485416D87B6B6B98259c32E789D4f7Ce4CD2959c",
    abi: aaveV3ViewAbi
};

/**
 * returns market data for a list of tokens
 * @param {string} market address of the Aave market
 * @param {string[]} assets array of asset addresses
 * @returns {Object} object that has market data for each token used as input
 */
async function getFullTokensInfo(market, assets) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, signer);

    return await view.getFullTokensInfo(market, assets);
}

/**
 * return data about a particular users position in Aave
 * @param {string} market address of aave market
 * @param {string} user address of the user
 * @returns {Object} information about users position from view contract
 */
async function getLoanData(market, user) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, signer);

    const loanData = await view.getLoanData(market, user);

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

module.exports = {
    getFullTokensInfo,
    getLoanData
};
