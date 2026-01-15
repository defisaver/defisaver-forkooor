const hre = require("hardhat");
const { aaveV4ViewAbi } = require("../../abi/aaveV4/abis");
const { addresses } = require("../../utils");

/**
 * return data about a particular users position in AaveV4
 * @param {string} spoke address of aave spoke
 * @param {string} user address of the user
 * @returns {Object} information about users position from view contract
 */
async function getLoanData(spoke, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewAddress = addresses[chainId].AAVE_V4_VIEW;
    const viewContract = new hre.ethers.Contract(viewAddress, aaveV4ViewAbi, signer);

    const loanData = await viewContract.getLoanData(spoke, user);

    return {
        user: loanData.user,
        riskPremium: loanData.riskPremium.toString(),
        avgCollateralFactor: loanData.avgCollateralFactor.toString(),
        healthFactor: loanData.healthFactor.toString(),
        totalCollateralInUsd: loanData.totalCollateralInUsd.toString(),
        totalDebtInUsd: loanData.totalDebtInUsd.toString(),
        activeCollateralCount: loanData.activeCollateralCount.toString(),
        borrowedCount: loanData.borrowedCount.toString(),
        reserves: loanData.reserves.map(reserve => ({
            reserveId: reserve.reserveId.toString(),
            assetId: reserve.assetId.toString(),
            underlying: reserve.underlying,
            supplied: reserve.supplied.toString(),
            drawn: reserve.drawn.toString(),
            premium: reserve.premium.toString(),
            totalDebt: reserve.totalDebt.toString(),
            collateralFactor: reserve.collateralFactor.toString(),
            maxLiquidationBonus: reserve.maxLiquidationBonus.toString(),
            liquidationFee: reserve.liquidationFee.toString(),
            isUsingAsCollateral: reserve.isUsingAsCollateral,
            isBorrowing: reserve.isBorrowing
        }))
    };
}

/**
 * Get spoke data including all reserves
 * @param {string} spoke address of aave spoke
 * @returns {Object} spoke data and reserves array
 */
async function getSpokeData(spoke) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewAddress = addresses[chainId].AAVE_V4_VIEW;
    const viewContract = new hre.ethers.Contract(viewAddress, aaveV4ViewAbi, signer);

    const [spokeData, reserves] = await viewContract.getSpokeData(spoke);

    return {
        spokeData: {
            targetHealthFactor: spokeData.targetHealthFactor.toString(),
            healthFactorForMaxBonus: spokeData.healthFactorForMaxBonus.toString(),
            liquidationBonusFactor: spokeData.liquidationBonusFactor.toString(),
            oracle: spokeData.oracle,
            oracleDecimals: spokeData.oracleDecimals.toString(),
            reserveCount: spokeData.reserveCount.toString()
        },
        reserves: reserves.map((reserve, index) => ({
            reserveId: index,
            underlying: reserve.underlying,
            collateralFactor: reserve.collateralFactor.toString(),
            price: reserve.price.toString()
        }))
    };
}

/**
 * Find reserveId for a given token address in the spoke
 * @param {string} spoke address of aave spoke
 * @param {string} tokenAddress address of the token to find
 * @returns {number} reserveId for the token
 */
async function getReserveIdByToken(spoke, tokenAddress) {
    const { reserves } = await getSpokeData(spoke);
    const reserve = reserves.find(r => r.underlying.toLowerCase() === tokenAddress.toLowerCase());

    if (!reserve) {
        throw new Error(`Token ${tokenAddress} not found in spoke ${spoke}`);
    }

    return reserve.reserveId;
}

/**
 * Get reserve info for multiple tokens
 * @param {string} spoke address of aave spoke
 * @param {Array<string>} tokenAddresses array of token addresses
 * @returns {Array<Object>} array of reserve info objects with reserveId
 */
async function getReserveInfoForTokens(spoke, tokenAddresses) {
    const { reserves } = await getSpokeData(spoke);

    return tokenAddresses.map(tokenAddress => {
        const reserve = reserves.find(r => r.underlying.toLowerCase() === tokenAddress.toLowerCase());

        if (!reserve) {
            throw new Error(`Token ${tokenAddress} not found in spoke ${spoke}`);
        }

        return reserve;
    });
}

module.exports = {
    getLoanData,
    getSpokeData,
    getReserveIdByToken,
    getReserveInfoForTokens
};
