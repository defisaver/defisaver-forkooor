const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfoByAddress } = require("@defisaver/tokens");
const { getSender, setBalance, approve, executeAction } = require("../../utils");
const { curveusdControllerAbi } = require("../../abi/curveusd/abis");
const { getUserData } = require("./view");

/**
 * Create a CurveUsd position for sender on his proxy (created if he doesn't have one)
 * @param {string} controller Crvusd controller address
 * @param {number} coll amount of collateral to be supplied (whole number)
 * @param {number} debt amount of crvusd debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {number} numberOfBands number of bands for creating a new curveusd position
 * @returns {Object} object that has users position data in it
 */
async function createCurveUsdPosition(controller, coll, debt, owner, numberOfBands) {
    const [senderAcc, proxy] = await getSender(owner);
    const controllerContract = new hre.ethers.Contract(controller, curveusdControllerAbi, senderAcc);
    const collateralTokenAddress = await controllerContract.collateral_token();


    // set coll balance for the user
    await setBalance(collateralTokenAddress, owner, coll);

    // approve coll asset for proxy to pull
    await approve(collateralTokenAddress, proxy.address, owner);
    const collTokenInfo = getAssetInfoByAddress(collateralTokenAddress);
    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), collTokenInfo.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debt.toString(), 18);
    const createPositionRecipe = new dfs.Recipe("CreateCurveUsdPosition", [
        new dfs.actions.curveusd.CurveUsdCreateAction(controller, owner, owner, amountColl, amountDebt, numberOfBands)
    ]);
    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);
    return await getUserData(controller, proxy.address);
}


module.exports = {
    createCurveUsdPosition
};
