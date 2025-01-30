/* eslint-disable eqeqeq */
const hre = require("hardhat");

const { setBalance, approve, addresses, ETH_ADDRESS, getSender, executeAction } = require("../../utils");
const { getAssetInfo } = require("@defisaver/tokens");
const { configure } = require("@defisaver/sdk");
const dfs = require("@defisaver/sdk");
const { fluidVaultResolverAbi, fluidVaultT1Abi } = require("../../abi/fluid/abis");
const { getPositionByNftId } = require("./view");

/**
 * Function that opens a fluid T1 Vault position
 * @param {string} vaultId ID of the vault
 * @param {string} collTokenSymbol collateral token symbol
 * @param {number} collAmount collateral amount
 * @param {string} debtTokenSymbol debt token symbol
 * @param {number} debtAmount debt amount
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} Obj that contains Fluid T1 position info
 */
async function fluidT1Open(
    vaultId,
    collTokenSymbol,
    collAmount,
    debtTokenSymbol,
    debtAmount,
    owner,
    proxyAddr,
    useSafe
) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    configure({
        chainId
    });

    const vaultResolverContract = await hre.ethers.getContractAt(fluidVaultResolverAbi, addresses[chainId].FLUID_VAULT_RESOLVER);
    const vaultAddress = await vaultResolverContract.getVaultAddress(vaultId);
    const vaultType = await vaultResolverContract.getVaultType(vaultAddress);

    if (vaultType != 10000) {
        throw new Error("Vault type is not T1 (1 coll : 1 debt)");
    }
    const vaultContract = await hre.ethers.getContractAt(fluidVaultT1Abi, vaultAddress);
    const constantsView = await vaultContract.constantsView();

    const collTokenData = getAssetInfo(collTokenSymbol === "ETH" ? "WETH" : collTokenSymbol, chainId);
    const debtTokenData = getAssetInfo(debtTokenSymbol === "ETH" ? "WETH" : debtTokenSymbol, chainId);

    if (collTokenSymbol === "ETH" && constantsView.supplyToken !== ETH_ADDRESS) {
        throw new Error("Collateral token does not match vault collateral token");
    }
    if (collTokenSymbol !== "ETH" && constantsView.supplyToken !== collTokenData.addresses[chainId]) {
        throw new Error("Collateral token does not match vault collateral token");
    }
    if (debtTokenSymbol === "ETH" && constantsView.borrowToken !== ETH_ADDRESS) {
        throw new Error("Debt token does not match vault debt token");
    }
    if (debtTokenSymbol !== "ETH" && constantsView.borrowToken !== debtTokenData.addresses[chainId]) {
        throw new Error("Debt token does not match vault debt token");
    }

    const collAmountScaled = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const debtAmountScaled = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

    await setBalance(collTokenData.addresses[chainId], owner, collAmountScaled);
    await approve(collTokenData.addresses[chainId], proxy.address, owner);

    const fluidT1OpenAction = new dfs.actions.fluid.FluidVaultT1OpenAction(
        vaultAddress,
        collAmountScaled,
        debtAmountScaled,
        senderAcc.address,
        senderAcc.address
    );
    const recipe = new dfs.Recipe("FluidT1Open", [fluidT1OpenAction]);
    const functionData = recipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    const nfts = await vaultResolverContract.positionsNftIdOfUser(proxy.address);
    const createdNft = nfts[nfts.length - 1];

    return await getPositionByNftId(createdNft);
}

module.exports = {
    fluidT1Open
};
