const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfo } = require("@defisaver/tokens");
const { getSender, setBalance, executeAction, approve } = require("../../utils");
const { getLoanData } = require("./view");

/**
 * Create a Compound V3 position for sender on his proxy (created if he doesn't have one)
 * @param {string} market CompoundV3 market address
 * @param {string} collToken symbol of collateral token e.g WETH
 * @param {number} collAmount amount of collateral to supply (whole number)
 * @param {string} borrowToken symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object with load data
 */
async function createCompoundV3Position(market, collToken, collAmount, borrowToken, borrowAmount, owner) {
    const [senderAcc, proxy] = await getSender(owner);
    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = getAssetInfo(collToken === "ETH" ? "WETH" : collToken, chainId);
    const borrowTokenData = getAssetInfo(borrowToken === "ETH" ? "WETH" : borrowToken, chainId);

    // set balance will parse the amount according to token decimals
    await setBalance(collTokenData.address, owner, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const collAmountParsed = hre.ethers.utils.parseUnits(
        collAmount.toString(), collTokenData.decimals
    );
    const borrowAmountParsed = hre.ethers.utils.parseUnits(
        borrowAmount.toString(), borrowTokenData.decimals
    );

    const supplyAction = new dfs.actions.compoundV3.CompoundV3SupplyAction(
        market,
        collTokenData.address,
        collAmountParsed.toString(),
        senderAcc._address, // from
        proxy.address // onBehalfOf
    );

    const borrowAction = new dfs.actions.compoundV3.CompoundV3BorrowAction(
        market,
        borrowAmountParsed.toString(),
        senderAcc._address, // to
        proxy.address // onBehalfOf
    );

    const createPositionRecipe = new dfs.Recipe("CreateCompoundV3PositionRecipe", [
        supplyAction,
        borrowAction
    ]);

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return await getLoanData(market, proxy.address);
}

module.exports = {
    createCompoundV3Position
};
