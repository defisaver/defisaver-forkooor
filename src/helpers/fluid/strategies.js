/* eslint-disable eqeqeq */
const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, addresses, isWalletSafe, getWalletOwner } = require("../../utils");
const { getPositionByNftId } = require("./view");
const { fluidVaultResolverAbi } = require("../../abi/fluid/abis");

/**
 * Subscribes to Fluid T1 Leverage Management Automation strategy
 * @param {string} nftId NFT ID representing the position
 * @param {number} triggerRatio Trigger ratio
 * @param {number} targetRatio Target ratio
 * @param {string} ratioState "under" for repay and "over" for boost
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subFluidT1LeverageManagement(nftId, triggerRatio, targetRatio, ratioState) {

    try {
        const { chainId } = await hre.ethers.provider.getNetwork();

        const positionData = await getPositionByNftId(nftId);
        const proxyAddr = positionData.position.owner;
        const owner = await getWalletOwner(proxyAddr);
        const isSafe = await isWalletSafe(proxyAddr);

        const [, proxy] = await getSender(owner, proxyAddr, isSafe);

        const vaultResolverContract = await hre.ethers.getContractAt(fluidVaultResolverAbi, addresses[chainId].FLUID_VAULT_RESOLVER);
        const vaultAddress = await vaultResolverContract.getVaultAddress(positionData.vaultData.vaultId);
        const vaultType = await vaultResolverContract.getVaultType(vaultAddress);

        if (vaultType != 10000) {
            throw new Error("Vault type is not T1 (1 coll : 1 debt)");
        }

        const ratioStateEnum = ratioState.toLowerCase() === "under" ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER;
        let bundleId;

        if (chainId === 42161) {
            bundleId = ratioStateEnum === automationSdk.enums.RatioState.UNDER
                ? automationSdk.enums.Bundles.ArbitrumIds.FLUID_T1_REPAY
                : automationSdk.enums.Bundles.ArbitrumIds.FLUID_T1_BOOST;
        } else if (chainId === 8453) {
            bundleId = ratioStateEnum === automationSdk.enums.RatioState.UNDER
                ? automationSdk.enums.Bundles.BaseIds.FLUID_T1_REPAY
                : automationSdk.enums.Bundles.BaseIds.FLUID_T1_BOOST;
        } else {
            bundleId = ratioStateEnum === automationSdk.enums.RatioState.UNDER
                ? automationSdk.enums.Bundles.MainnetIds.FLUID_T1_REPAY
                : automationSdk.enums.Bundles.MainnetIds.FLUID_T1_BOOST;
        }

        const strategySub = automationSdk.strategySubService.fluidEncode.leverageManagement(
            nftId,
            vaultAddress,
            ratioStateEnum,
            targetRatio,
            triggerRatio,
            bundleId
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    subFluidT1LeverageManagement
};
