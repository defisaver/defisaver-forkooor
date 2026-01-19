const hre = require("hardhat");
const { sparkViewAbi } = require("../../abi/spark/abis");
const { addresses, getSparkMarketAddress } = require("../../utils");

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
        const { chainId } = await hre.ethers.provider.getNetwork();
        const marketAddress = await getSparkMarketAddress(market);
        const viewAddress = addresses[chainId].SPARK_VIEW;

        if (!viewAddress) {
            throw new Error(`Spark view address not configured for chainId=${chainId}`);
        }

        const sparkView = new hre.ethers.Contract(viewAddress, sparkViewAbi, signer);

        return await sparkView.getFullTokensInfo(marketAddress, assets);
    } catch (err) {
        console.error(err);
        throw err;
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
        const { chainId } = await hre.ethers.provider.getNetwork();
        const marketAddress = await getSparkMarketAddress(market);
        const viewAddress = addresses[chainId].SPARK_VIEW;
        const viewContract = new hre.ethers.Contract(viewAddress, sparkViewAbi, signer);

        const ld = await viewContract.getLoanData(marketAddress, user);

        return convertToJson(ld);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    getFullTokensInfo,
    getLoanData
};
