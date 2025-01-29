const hre = require("hardhat");
const { addresses } = require("../../utils");
const { fluidViewAbi } = require("../../abi/fluid/abis");

/**
 * return fluid position data for a specific NFT
 * @param {nftId} ntfId nft id representing the position
 * @returns {Object} position data for NFT
 */
async function getPositionByNftId(ntfId) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const viewContract = await hre.ethers.getContractAt(fluidViewAbi, addresses[chainId].FLUID_VIEW);
    const data = await viewContract.getPositionByNftId(ntfId);

    return {
        position: {
            nftId: data.position.nftId.toString(),
            owner: data.position.owner.toString(),
            isLiquidated: data.position.isLiquidated,
            isSupplyPosition: data.position.isSupplyPosition,
            supply: data.position.supply.toString(),
            borrow: data.position.borrow.toString(),
            tick: data.position.tick.toString(),
            tickId: data.position.tickId.toString()
        },
        vaultData: {
            vault: data.vault.vault,
            vaultId: data.vault.vaultId.toString(),
            vaultType: data.vault.vaultType.toString(),
            isSmartColl: data.vault.isSmartColl,
            isSmartDebt: data.vault.isSmartDebt,
            supplyToken0: data.vault.supplyToken0,
            supplyToken1: data.vault.supplyToken1,
            borrowToken0: data.vault.borrowToken0,
            borrowToken1: data.vault.borrowToken1,
            supplyToken0Decimals: data.vault.supplyToken0Decimals.toString(),
            supplyToken1Decimals: data.vault.supplyToken1Decimals.toString(),
            borrowToken0Decimals: data.vault.borrowToken0Decimals.toString(),
            borrowToken1Decimals: data.vault.borrowToken1Decimals.toString(),
            collateralFactor: data.vault.collateralFactor.toString(),
            liquidationThreshold: data.vault.liquidationThreshold.toString(),
            liquidationMaxLimit: data.vault.liquidationMaxLimit.toString(),
            withdrawalGap: data.vault.withdrawalGap.toString(),
            liquidationPenalty: data.vault.liquidationPenalty.toString(),
            borrowFee: data.vault.borrowFee.toString(),
            oracle: data.vault.oracle,
            oraclePriceOperate: data.vault.oraclePriceOperate.toString(),
            oraclePriceLiquidate: data.vault.oraclePriceLiquidate.toString(),
            priceOfSupplyToken0InUSD: data.vault.priceOfSupplyToken0InUSD.toString(),
            priceOfSupplyToken1InUSD: data.vault.priceOfSupplyToken1InUSD.toString(),
            priceOfBorrowToken0InUSD: data.vault.priceOfBorrowToken0InUSD.toString(),
            priceOfBorrowToken1InUSD: data.vault.priceOfBorrowToken1InUSD.toString(),
            vaultSupplyExchangePrice: data.vault.vaultSupplyExchangePrice.toString(),
            vaultBorrowExchangePrice: data.vault.vaultBorrowExchangePrice.toString(),
            supplyRateVault: data.vault.supplyRateVault.toString(),
            borrowRateVault: data.vault.borrowRateVault.toString(),
            rewardsOrFeeRateSupply: data.vault.rewardsOrFeeRateSupply.toString(),
            rewardsOrFeeRateBorrow: data.vault.rewardsOrFeeRateBorrow.toString(),
            totalPositions: data.vault.totalPositions.toString(),
            totalSupplyVault: data.vault.totalSupplyVault.toString(),
            totalBorrowVault: data.vault.totalBorrowVault.toString(),
            withdrawalLimit: data.vault.withdrawalLimit.toString(),
            withdrawableUntilLimit: data.vault.withdrawableUntilLimit.toString(),
            withdrawable: data.vault.withdrawable.toString(),
            baseWithdrawalLimit: data.vault.baseWithdrawalLimit.toString(),
            withdrawExpandPercent: data.vault.withdrawExpandPercent.toString(),
            withdrawExpandDuration: data.vault.withdrawExpandDuration.toString(),
            borrowLimit: data.vault.borrowLimit.toString(),
            borrowableUntilLimit: data.vault.borrowableUntilLimit.toString(),
            borrowable: data.vault.borrowable.toString(),
            borrowLimitUtilization: data.vault.borrowLimitUtilization.toString(),
            maxBorrowLimit: data.vault.maxBorrowLimit.toString(),
            borrowExpandPercent: data.vault.borrowExpandPercent.toString(),
            borrowExpandDuration: data.vault.borrowExpandDuration.toString(),
            baseBorrowLimit: data.vault.baseBorrowLimit.toString(),
            minimumBorrowing: data.vault.minimumBorrowing.toString()
        }
    };
}

module.exports = {
    getPositionByNftId
};
