const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, setBalance, executeAction, approve, getTokenInfo } = require("../../utils");
const { getLoanData, COMP_V3_MARKETS } = require("./view");
const { cometAbi } = require("../../abi/general");

/**
 * Create a Compound V3 position for sender on his proxy (created if he doesn't have one)
 * @param {string|null} marketSymbol Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH). Optional - if not provided, will derive from debtSymbol
 * @param {string} collSymbol symbol of collateral token e.g WETH
 * @param {number} collAmount amount of collateral to supply in token units (supports decimals, e.g. 3.5)
 * @param {string} debtSymbol symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if proxyAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object with loan data
 */
async function createCompoundV3Position(marketSymbol, collSymbol, collAmount, debtSymbol, borrowAmount, eoa, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = await getTokenInfo(collSymbol);
    const borrowTokenData = await getTokenInfo(debtSymbol);

    // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
    const resolvedMarketSymbol = marketSymbol || debtSymbol;

    if (!COMP_V3_MARKETS[chainId]) {
        throw new Error(`Chain ${chainId} is not supported`);
    }

    const marketAddress = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

    if (!marketAddress) {
        throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
    }

    // set balance will parse the amount according to token decimals
    await setBalance(collTokenData.address, eoa, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, eoa);

    const collAmountParsed = hre.ethers.utils.parseUnits(
        collAmount.toString(), collTokenData.decimals
    );
    const borrowAmountParsed = hre.ethers.utils.parseUnits(
        borrowAmount.toString(), borrowTokenData.decimals
    );

    const supplyAction = new dfs.actions.compoundV3.CompoundV3SupplyAction(
        marketAddress,
        collTokenData.address,
        collAmountParsed.toString(),
        senderAcc.address, // from
        proxy.address // onBehalfOf
    );

    const borrowAction = new dfs.actions.compoundV3.CompoundV3BorrowAction(
        marketAddress,
        borrowAmountParsed.toString(),
        senderAcc.address, // to
        proxy.address // onBehalfOf
    );

    const createPositionRecipe = new dfs.Recipe("CreateCompoundV3PositionRecipe", [
        supplyAction,
        borrowAction
    ]);

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return await getLoanData(marketAddress, proxy.address);
}

/**
 * Create a Compound V3 position for EOA
 * @param {string|null} marketSymbol Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH). Optional - if not provided, will derive from debtSymbol
 * @param {string} collSymbol symbol of collateral token e.g WETH, USDC, USDT, etc.
 * @param {number} collAmount amount of collateral to supply in token units (supports decimals, e.g. 3.5)
 * @param {string} debtSymbol symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the position
 * @returns {Object} object with loan data
 */
async function createCompoundV3EOAPosition(
    marketSymbol,
    collSymbol,
    collAmount,
    debtSymbol,
    borrowAmount,
    eoa
) {
    const senderAcc = await hre.ethers.provider.getSigner(eoa.toString());

    senderAcc.address = senderAcc._address;

    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = await getTokenInfo(collSymbol);
    const borrowTokenData = await getTokenInfo(debtSymbol);
    const collAmountParsed = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const borrowAmountParsed = hre.ethers.utils.parseUnits(borrowAmount.toString(), borrowTokenData.decimals);

    // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
    const resolvedMarketSymbol = marketSymbol || debtSymbol;

    if (!COMP_V3_MARKETS[chainId]) {
        throw new Error(`Chain ${chainId} is not supported`);
    }

    const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

    if (!market) {
        throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
    }

    await setBalance(collTokenData.address, eoa, collAmount);
    await approve(collTokenData.address, market, eoa);

    let cometContract = new hre.ethers.Contract(market, cometAbi, senderAcc);

    cometContract = cometContract.connect(senderAcc);

    await cometContract.supplyTo(senderAcc.address, collTokenData.address, collAmountParsed);
    await cometContract.withdrawFrom(senderAcc.address, senderAcc.address, borrowTokenData.address, borrowAmountParsed);

    return await getLoanData(market, senderAcc.address);
}

/**
 * Add a manager to a Compound V3 position for EOA
 * @param {string} marketSymbol symbol of the market e.g USDC, USDT, etc.
 * @param {string} eoa the EOA which will be sending transactions and allowing the manager to manage the position
 * @param {string} manager the address of the manager to add
 * @returns {Object} object with data
 */
async function addManager(marketSymbol, eoa, manager) {
    const senderAcc = await hre.ethers.provider.getSigner(eoa.toString());

    senderAcc.address = senderAcc._address;

    const { chainId } = await hre.ethers.provider.getNetwork();

    if (!COMP_V3_MARKETS[chainId]) {
        throw new Error(`Chain ${chainId} is not supported`);
    }

    const resolvedMarketSymbol = marketSymbol === "ETH" ? "WETH" : marketSymbol;
    const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol];

    if (!market) {
        throw new Error(`Market not found for symbol ${marketSymbol} on chain ${chainId}`);
    }

    let cometContract = new hre.ethers.Contract(market, cometAbi, senderAcc);

    cometContract = cometContract.connect(senderAcc);

    await cometContract.allow(manager, true);

    return { eoa, manager };
}

module.exports = {
    createCompoundV3Position,
    createCompoundV3EOAPosition,
    addManager
};
