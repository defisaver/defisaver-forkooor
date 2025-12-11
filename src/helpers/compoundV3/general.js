const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, setBalance, executeAction, approve, getTokenInfo } = require("../../utils");
const { getLoanData, COMP_V3_MARKETS } = require("./view");
const { cometAbi } = require("../../abi/general");

/**
 * Create a Compound V3 position for sender on his proxy (created if he doesn't have one)
 * @param {string} market CompoundV3 market address
 * @param {string} collSymbol symbol of collateral token e.g WETH
 * @param {number} collAmount amount of collateral to supply (whole number)
 * @param {string} debtSymbol symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object with load data
 */
async function createCompoundV3Position(market, collSymbol, collAmount, debtSymbol, borrowAmount, owner, proxyAddr, useSafe) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = getTokenInfo(collSymbol, chainId);
    const borrowTokenData = getTokenInfo(debtSymbol, chainId);

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

/**
 * Create a Compound V3 position for sender on his proxy (created if he doesn't have one)
 * @param {string} collSymbol symbol of collateral token e.g WETH, USDC, USDT, etc.
 * @param {number} collAmount amount of collateral to supply (whole number)
 * @param {string} debtSymbol symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow (whole number)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object with load data
 */
async function createCompoundV3ProxyPosition(
    collSymbol,
    collAmount,
    debtSymbol,
    borrowAmount,
    eoa,
    proxyAddr,
    useSafe
) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = getTokenInfo(collSymbol, chainId);
    const borrowTokenData = getTokenInfo(debtSymbol, chainId);

    await setBalance(collTokenData.address, eoa, collAmount);
    await approve(collTokenData.address, proxy.address, eoa);

    const collAmountParsed = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const borrowAmountParsed = hre.ethers.utils.parseUnits(borrowAmount.toString(), borrowTokenData.decimals);

    const market = COMP_V3_MARKETS[chainId][debtSymbol === "ETH" ? "WETH" : debtSymbol];

    const supplyAction = new dfs.actions.compoundV3.CompoundV3SupplyAction(
        market,
        collTokenData.address,
        collAmountParsed.toString(),
        senderAcc.address,
        proxy.address
    );
    const borrowAction = new dfs.actions.compoundV3.CompoundV3BorrowAction(
        market,
        borrowAmountParsed.toString(),
        senderAcc.address,
        proxy.address
    );
    const recipe = new dfs.Recipe("CreateCompoundV3ProxyPositionRecipe", [
        supplyAction,
        borrowAction
    ]);

    const functionData = recipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return await getLoanData(market, proxy.address);
}

/**
 * Create a Compound V3 position for EOA
 * @param {string} collSymbol symbol of collateral token e.g WETH, USDC, USDT, etc.
 * @param {number} collAmount amount of collateral to supply (whole number)
 * @param {string} debtSymbol symbol of borrow token e.g USDC
 * @param {number} borrowAmount amount to borrow (whole number)
 * @param {string} eoa the EOA which will be sending transactions and own the position
 * @returns {Object} object with load data
 */
async function createCompoundV3EOAPosition(
    collSymbol,
    collAmount,
    debtSymbol,
    borrowAmount,
    eoa
) {
    const senderAcc = await hre.ethers.provider.getSigner(eoa.toString());

    senderAcc.address = senderAcc._address;

    const { chainId } = await hre.ethers.provider.getNetwork();

    const collTokenData = getTokenInfo(collSymbol, chainId);
    const borrowTokenData = getTokenInfo(debtSymbol, chainId);
    const collAmountParsed = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const borrowAmountParsed = hre.ethers.utils.parseUnits(borrowAmount.toString(), borrowTokenData.decimals);

    const market = COMP_V3_MARKETS[chainId][debtSymbol === "ETH" ? "WETH" : debtSymbol];

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

    const market = COMP_V3_MARKETS[chainId][marketSymbol === "ETH" ? "WETH" : marketSymbol];

    let cometContract = new hre.ethers.Contract(market, cometAbi, senderAcc);

    cometContract = cometContract.connect(senderAcc);

    await cometContract.allow(manager, true);

    return { eoa, manager };
}

module.exports = {
    createCompoundV3Position,
    createCompoundV3ProxyPosition,
    createCompoundV3EOAPosition,
    addManager
};
