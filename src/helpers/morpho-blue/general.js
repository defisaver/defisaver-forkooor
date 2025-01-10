const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfoByAddress } = require("@defisaver/tokens");
const { getSender, setBalance, approve, executeAction, addresses } = require("../../utils");
const { getUserData } = require("./view");
const { morphoBlueAbi } = require("../../abi/morpho-blue/abis");

/**
 * Create a MorphoBlue position for sender on his proxy (created if he doesn't have one)
 * @param {Object} marketParams MorphoBlue marketParams
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if proxyAddr is not provided
 * @param {number} coll amount of collateral to be supplied (whole number)
 * @param {number} debt amount of debt to be generated (whole number)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createMorphoBluePosition(marketParams, owner, coll, debt, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const { chainId } = await hre.ethers.provider.getNetwork();

    dfs.configure({
        chainId,
        testMode: false
    });

    const morphoBlueAddress = addresses[chainId].MORPHO_BLUE;

    const [wallet] = await hre.ethers.getSigners();

    await setBalance(marketParams.collateralToken, owner, coll);
    await approve(marketParams.collateralToken, proxy.address, owner);

    const collTokenInfo = getAssetInfoByAddress(marketParams.collateralToken, chainId);
    const debtTokenInfo = getAssetInfoByAddress(marketParams.loanToken, chainId);

    console.log(chainId);
    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), collTokenInfo.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debt.toString(), debtTokenInfo.decimals);

    const createPositionRecipe = new dfs.Recipe("CreateMorphoBluePosition", [
        new dfs.actions.morphoblue.MorphoBlueSupplyCollateralAction(
            marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv,
            amountColl, senderAcc.address, proxy.address
        ),
        new dfs.actions.morphoblue.MorphoBlueBorrowAction(
            marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv,
            amountDebt, proxy.address, senderAcc.address
        )
    ]);

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    // supply loan token so there's enough liquidity
    const morphoBlueContract = new hre.ethers.Contract(morphoBlueAddress, morphoBlueAbi, wallet);

    await setBalance(
        marketParams.loanToken,
        wallet.address,
        amountDebt.mul(2)
    );
    await approve(marketParams.loanToken, morphoBlueAddress, wallet.address);
    await morphoBlueContract.supply(marketParams, amountDebt.mul(2), "0", wallet.address, [], { gasLimit: 3000000 });
    await executeAction("RecipeExecutor", functionData, proxy);
    return await getUserData(marketParams, proxy.address);
}


module.exports = {
    createMorphoBluePosition
};
