/* eslint-disable eqeqeq */
const hre = require("hardhat");

const { setBalance, approve, addresses, ETH_ADDRESS, getSender, executeAction } = require("../../utils");
const { getTokenInfo } = require("../../utils");
const dfs = require("@defisaver/sdk");
const { fluidVaultResolverAbi, fluidVaultT1Abi } = require("../../abi/fluid/abis");
const { getPositionByNftId } = require("./view");

/**
 * Function that opens a fluid T1 Vault position
 * @param {string} vaultId ID of the vault
 * @param {string} collSymbol collateral token symbol
 * @param {number} collAmount collateral amount
 * @param {string} debtSymbol debt token symbol
 * @param {number} debtAmount debt amount
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} Obj that contains Fluid T1 position info
 */
async function fluidT1Open(
    vaultId,
    collSymbol,
    collAmount,
    debtSymbol,
    debtAmount,
    owner,
    proxyAddr,
    useSafe
) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    const vaultResolverContract = await hre.ethers.getContractAt(fluidVaultResolverAbi, addresses[chainId].FLUID_VAULT_RESOLVER);
    const vaultAddress = await vaultResolverContract.getVaultAddress(vaultId);
    const vaultType = await vaultResolverContract.getVaultType(vaultAddress);

    if (vaultType != 10000) {
        throw new Error("Vault type is not T1 (1 coll : 1 debt)");
    }
    const vaultContract = await hre.ethers.getContractAt(fluidVaultT1Abi, vaultAddress);
    const constantsView = await vaultContract.constantsView();

    const collTokenData = await getTokenInfo(collSymbol);
    const debtTokenData = await getTokenInfo(debtSymbol);

    if (collSymbol === "ETH" && constantsView.supplyToken !== ETH_ADDRESS) {
        throw new Error(`Collateral token mismatch: ETH provided but vault expects ${constantsView.supplyToken}`);
    }
    if (collSymbol !== "ETH" && constantsView.supplyToken !== collTokenData.address) {
        throw new Error(`Collateral token mismatch: Vault expects ${constantsView.supplyToken}, but ${collTokenData.address} (${collSymbol}) was provided`);
    }
    if (debtSymbol === "ETH" && constantsView.borrowToken !== ETH_ADDRESS) {
        throw new Error(`Debt token mismatch: ETH provided but vault expects ${constantsView.borrowToken}`);
    }
    if (debtSymbol !== "ETH" && constantsView.borrowToken !== debtTokenData.address) {
        throw new Error(`Debt token mismatch: Vault expects ${constantsView.borrowToken}, but ${debtTokenData.address} (${debtSymbol}) was provided`);
    }

    const collAmountScaled = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const debtAmountScaled = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

    await setBalance(collTokenData.address, owner, collAmount);
    await approve(collTokenData.address, proxy.address, owner);

    const fluidT1OpenAction = new dfs.actions.fluid.FluidVaultT1OpenAction(
        vaultAddress,
        collAmountScaled,
        debtAmountScaled,
        senderAcc.address,
        senderAcc.address,
        false, // wrapBorrowedEth
        collTokenData.address // collToken
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
