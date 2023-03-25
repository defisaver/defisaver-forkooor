const { ilks } = require("@defisaver/tokens");
const hre = require("hardhat");
const { subProxyAbi, subStorageAbi } = require("../../abi/general");
const { getProxy, addresses, getAddrFromRegistry } = require("../../utils");
const { getVaultInfo, getMcdManagerAddr } = require("../maker/view");

const abiCoder = new hre.ethers.utils.AbiCoder();

const MCD_CLOSE_TO_DAI_ID = 7;
const MCD_CLOSE_TO_COLL_ID = 9;

/**
 * Encodes three parameteres that are neeeded for subbing to DFS ChainlinkPriceTrigger
 * @param {string} tokenAddr address of the token which price we're checking
 * @param {number} price price in whole number - 1500
 * @param {number} state 0/1 for over/under
 * @returns {string} abi encoded trigger data
 */
async function createChainLinkPriceTrigger(tokenAddr, price, state) {

    const formattedPrice = (price * 1e8).toString();
    const triggerData = abiCoder.encode(["address", "uint256", "uint8"], [tokenAddr, formattedPrice, state]);

    return triggerData;
}

/**
 * Get latest Subscription ID from SubStorage
 * @returns {number} ID of the latest subscription
 */
async function getLatestSubId() {
    const subStorageAddr = await getAddrFromRegistry("SubStorage");

    const [signer] = await hre.ethers.getSigners();
    const subStorage = new hre.ethers.Contract(subStorageAddr, subStorageAbi, signer);

    let latestSubId = await subStorage.getSubsCount();

    latestSubId = (latestSubId - 1).toString();

    return latestSubId;
}

/**
 * Subscribe to a strategy using SubProxy
 * @param {Object} proxy proxy Object which we want to use for sub
 * @param {Object} strategySub strategySub properly encoded
 * @returns {number} ID of the strategy subscription
 */
async function subToStrategy(proxy, strategySub) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, subProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subscribeToStrategy",
        [strategySub]
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    });

    const latestSubId = await getLatestSubId();

    return latestSubId;
}


/**
 * Subscribes to MCD Close to Dai strategy
 * @param {forKId} forkId ID of the tenderly fork
 * @param {number} vaultId ID of the MCD vault
 * @param {number} triggerPrice Price of the asset for which price we're checking (whole number)
 * @param {string} triggerState OVER/UNDER
 * @param {string} owner EOA of the Vault owner
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToDaiStrategy(forkId, vaultId, triggerPrice, triggerState, owner) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);

    let formattedPriceState;

    if (triggerState.toLowerCase() === "over") {
        formattedPriceState = 0;
    } else if (triggerState.toLowerCase() === "under") {
        formattedPriceState = 1;
    }
    const mcdManager = await getMcdManagerAddr();
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);

    const isBundle = false;

    const { chainId } = await hre.ethers.provider.getNetwork();
    const daiAddress = addresses[chainId].DAI_ADDR;

    const vaultIdEncoded = abiCoder.encode(["uint256"], [vaultId.toString()]);
    const daiEncoded = abiCoder.encode(["address"], [daiAddress]);
    const mcdManagerEncoded = abiCoder.encode(["address"], [mcdManager]);

    const triggerData = await createChainLinkPriceTrigger(
        ilkObj.assetAddress, triggerPrice, formattedPriceState
    );

    const strategySub = [MCD_CLOSE_TO_DAI_ID, isBundle, [triggerData], [vaultIdEncoded, daiEncoded, mcdManagerEncoded]];
    const subId = await subToStrategy(proxy, strategySub);


    return { strategySub, subId };
}

/**
 * Subscribes to MCD Close to Coll strategy
 * @param {forKId} forkId ID of the tenderly fork
 * @param {number} vaultId ID of the MCD vault
 * @param {number} triggerPrice Price of the asset for which price we're checking (whole number)
 * @param {string} triggerState OVER/UNDER
 * @param {string} owner EOA of the Vault owner
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subMcdCloseToCollStrategy(forkId, vaultId, triggerPrice, triggerState, owner) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);

    let formattedPriceState;

    if (triggerState.toLowerCase() === "over") {
        formattedPriceState = 0;
    } else if (triggerState.toLowerCase() === "under") {
        formattedPriceState = 1;
    }
    const mcdManager = await getMcdManagerAddr();
    const vault = await getVaultInfo(vaultId, mcdManager);
    const ilkObj = ilks.find(i => i.ilkLabel === vault.ilkLabel);

    const isBundle = false;
    const { chainId } = await hre.ethers.provider.getNetwork();
    const daiAddress = addresses[chainId].DAI_ADDR;

    const vaultIdEncoded = abiCoder.encode(["uint256"], [vaultId.toString()]);
    const collEncoded = abiCoder.encode(["address"], [ilkObj.assetAddress]);
    const daiEncoded = abiCoder.encode(["address"], [daiAddress]);
    const mcdManagerEncoded = abiCoder.encode(["address"], [mcdManager]);

    const triggerData = await createChainLinkPriceTrigger(
        ilkObj.assetAddress, triggerPrice, formattedPriceState
    );

    const strategySub = [MCD_CLOSE_TO_COLL_ID, isBundle, [triggerData], [vaultIdEncoded, collEncoded, daiEncoded, mcdManagerEncoded]];
    const subId = await subToStrategy(proxy, strategySub);


    return { strategySub, subId };
}

module.exports = {
    subMcdCloseToDaiStrategy,
    subMcdCloseToCollStrategy
};
