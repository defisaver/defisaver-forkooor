const hre = require("hardhat");

const { sparkViewAbi } = require("../../abi/spark/abis");

const SPARK_VIEW = "0x29d01EF37514912ab874D51fEc76c8f5d4d6712e";

/**
 * Convert loan data to Spark position with key names
 * @param {Object} loanData that has all the data needed to create a Spark position
 * @returns {Object} object that has all the data needed to create a Spark position with key names
 */
async function convertToJson(loanData) {
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
 * Function that fetches asset id in spark protocol
 * @param {string} market Market address
 * @param {string[]} assets Asset addresses
 * @returns {Object} objects that has asset id and asset address
 */
async function getFullTokensInfo(market, assets) {
    try {
        const [signer] = await hre.ethers.getSigners();
        const sparkView = new hre.ethers.Contract(SPARK_VIEW, sparkViewAbi, signer);

        return await sparkView.getFullTokensInfo(market, assets);
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * Function that fetches loan data from spark protocol
 * @param {string} market Market address
 * @param {string} user User address
 * @returns {Object} Loan data object
 */
async function getLoanData(market, user) {
    try {
        const [signer] = await hre.ethers.getSigners();
        const sparkView = new hre.ethers.Contract(SPARK_VIEW, sparkViewAbi, signer);

        const ld = await sparkView.getLoanData(market, user);

        return convertToJson(ld);
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = {
    getFullTokensInfo,
    getLoanData
};
