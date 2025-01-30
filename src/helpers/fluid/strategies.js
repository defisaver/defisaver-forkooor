/* eslint-disable eqeqeq */
const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, addresses, isWalletSafe, getWalletOwner } = require("../../utils");
const { getPositionByNftId } = require("./view");
const { fluidVaultResolverAbi, fluidVaultT1Abi } = require("../../abi/fluid/abis");

/**
 * Subscribes to Fluid T1 Leverage Management Automation strategy
 * @param {string} nftId nft ID representing the position
 * @param {number} ratio Trigger ratio
 * @param {number} targetRatio Target ratio
 * @param {string} ratioState "under" for repay and "over" for boost
 * @param {number} bundleId Bundle ID
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subFluidT1LeverageManagement(nftId, ratio, targetRatio, ratioState, bundleId) {

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

        const vaultContract = await hre.ethers.getContractAt(fluidVaultT1Abi, vaultAddress);
        const constantsView = await vaultContract.constantsView();

        const strategySub = automationSdk.strategySubService.fluidEncode.leverageManagement(
            nftId,
            vaultAddress,
            constantsView.supplyToken,
            constantsView.borrowToken,
            ratioState.toLocaleLowerCase() === "under" ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER,
            targetRatio,
            ratio,
            bundleId
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subFluidT1LeverageManagement
};
