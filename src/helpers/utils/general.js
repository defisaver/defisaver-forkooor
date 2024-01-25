const hre = require("hardhat");
const axios = require("axios");

const { botAuthAbi } = require("../../abi/general");
const { getHeaders, addresses, getAddrFromRegistry, topUpAccount, setupFork } = require("../../utils");

/**
 * Tops up DFS Owner account on a given Tenderly fork
 * @returns {void}
 */
async function topUpOwner() {
    const { chainId } = await hre.ethers.provider.getNetwork();

    const owner = addresses[chainId].OWNER_ACC;

    await topUpAccount(owner, 100);
}


/**
 * Sets a bot caller so it can execute some DFS related functions
 * @param {string} botAddr address that we are giving bot auth to
 * @returns {void}
 */
async function addBotCaller(botAddr) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const signer = await hre.ethers.provider.getSigner(addresses[chainId].OWNER_ACC);
    const botAuthAddr = await getAddrFromRegistry("BotAuth");
    const botAuth = new hre.ethers.Contract(botAuthAddr, botAuthAbi, signer);

    await botAuth.addCaller(botAddr, { gasLimit: 30000000 });
}

/**
 * Sets multiple bot callers so they can execute some DFS related functions
 * @param {string} forkId ID of the Tenderly fork
 * @param {Array<string>} botAccounts array of addresses that we are giving bot auth to
 * @returns {void}
 */
async function setUpBotAccounts(forkId, botAccounts = []) {
    await setupFork(forkId, botAccounts);

    for (let i = 0; i < botAccounts.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await addBotCaller(botAccounts[i]);
    }
}

/**
 * Increases timestamp on a given fork
 * @param {string} forkId ID of the Tenderly fork
 * @param {number} timeIncrease how much to increase the current timestamp in seconds
 * @returns {Object} returns timestamp before the change and updated timestamp
 */
async function timeTravel(forkId, timeIncrease) {
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);

    const oldTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    await hre.ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await hre.ethers.provider.send("evm_mine", []); // Just mines to the next block
    const newTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    return { oldTimestamp, newTimestamp };
}

/**
 * Creates a new Tenderly fork in defisaver-v2 organisation using provided input
 * @param {string} tenderlyProject name of the Tenderly project
 * @param {string} tenderlyAccessKey access key for Tenderly project
 * @param {number} chainId ID that represents which chain we want to fork
 * @returns {string} Tenderly fork id of the newly created fork
 */
async function createNewFork(tenderlyProject, tenderlyAccessKey, chainId) {
    // eslint-disable-next-line camelcase
    const body = { network_id: chainId };
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(`https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/fork`, body, { headers });

    return forkRes.data.simulation_fork.id;
}

/**
 * Forks an existing Tenderly fork in defisaver-v2 organisation using provided input
 * @param {string} cloningForkId fork ID of an existing fork
 * @param {string} tenderlyProject name of the Tenderly project
 * @param {string} tenderlyAccessKey access key for Tenderly project
 * @returns {string} Tenderly fork id of the newly created fork
 */
async function cloneFork(cloningForkId, tenderlyProject, tenderlyAccessKey) {
    const url = `https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/clone-fork`;

    // eslint-disable-next-line camelcase
    const body = { fork_id: cloningForkId };
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(url, body, { headers });

    return forkRes.data.simulation_fork.id;
}

/**
 * Creates a new Ethereum address
 * @returns {string} Newly created Ethereum address
 */
async function newAddress() {
    return hre.ethers.Wallet.createRandom().address;
}

module.exports = {
    createNewFork,
    cloneFork,
    topUpOwner,
    topUpAccount,
    setUpBotAccounts,
    timeTravel,
    newAddress
};
