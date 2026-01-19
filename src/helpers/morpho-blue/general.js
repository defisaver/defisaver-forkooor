const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, setBalance, approve, executeAction, addresses, getTokenInfo } = require("../../utils");
const { getUserData } = require("./view");
const { morphoBlueAbi } = require("../../abi/morpho-blue/abis");

/**
 * Create a MorphoBlue position for sender on his proxy (created if he doesn't have one)
 * @param {Object} marketParams MorphoBlue market params (symbol-based)
 * @param {string} marketParams.collSymbol collateral token symbol
 * @param {string} marketParams.debtSymbol debt token symbol
 * @param {string} marketParams.oracle oracle address
 * @param {string} marketParams.irm interest rate model address
 * @param {string} marketParams.lltv LLTV value (uint)
 * @param {number} collAmount amount of collateral to be supplied in token units (supports decimals, e.g. 1.5)
 * @param {number} debtAmount amount of debt to be generated in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function createMorphoBluePosition(marketParams, collAmount, debtAmount, eoa, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const { chainId } = await hre.ethers.provider.getNetwork();

    dfs.configure({
        chainId,
        testMode: false
    });

    const morphoBlueAddress = addresses[chainId].MORPHO_BLUE;

    const [wallet] = await hre.ethers.getSigners();

    const collTokenData = await getTokenInfo(marketParams.collSymbol);
    const debtTokenData = await getTokenInfo(marketParams.debtSymbol);

    const collateralToken = collTokenData.address;
    const loanToken = debtTokenData.address;

    await setBalance(collateralToken, eoa, collAmount);
    await approve(collateralToken, proxy.address, eoa);

    const marketParamsWithAddresses = {
        loanToken,
        collateralToken,
        oracle: marketParams.oracle,
        irm: marketParams.irm,
        lltv: marketParams.lltv
    };

    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const createPositionRecipe = new dfs.Recipe("CreateMorphoBluePosition", [
        new dfs.actions.morphoblue.MorphoBlueSupplyCollateralAction(
            loanToken, collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv,
            amountColl, senderAcc.address, proxy.address
        ),
        new dfs.actions.morphoblue.MorphoBlueBorrowAction(
            loanToken, collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv,
            amountDebt, proxy.address, senderAcc.address
        )
    ]);

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    // supply loan token so there's enough liquidity
    const morphoBlueContract = new hre.ethers.Contract(morphoBlueAddress, morphoBlueAbi, wallet);

    const liquidityAmount = hre.ethers.utils.formatUnits(amountDebt.mul(2), debtTokenData.decimals);

    await setBalance(
        loanToken,
        wallet.address,
        liquidityAmount
    );
    await approve(loanToken, morphoBlueAddress, wallet.address);
    await morphoBlueContract.supply(marketParamsWithAddresses, amountDebt.mul(2), "0", wallet.address, [], { gasLimit: 3000000 });
    await executeAction("RecipeExecutor", functionData, proxy);
    return await getUserData(marketParamsWithAddresses, proxy.address);
}


module.exports = {
    createMorphoBluePosition
};
