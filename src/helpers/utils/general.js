/* eslint-disable camelcase */
const hre = require("hardhat");
const axios = require("axios");
const uuid = require("uuid").v4;

const { botAuthAbi } = require("../../abi/general");
const { getHeaders, addresses, getAddrFromRegistry, topUpAccount, setupVnet } = require("../../utils");

/**
 * Tops up DFS Owner account on a given Tenderly vnet
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
 * @param {string} vnetId RPC URL of the Tenderly vnet
 * @param {Array<string>} botAccounts array of addresses that we are giving bot auth to
 * @returns {void}
 */
async function setUpBotAccounts(vnetId, botAccounts = []) {
    await setupVnet(vnetId, botAccounts);

    for (let i = 0; i < botAccounts.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await addBotCaller(botAccounts[i]);
    }
}

/**
 * Increases timestamp on a given vnet
 * @param {string} vnetId RPC URL of the Tenderly vnet
 * @param {number} timeIncrease how much to increase the current timestamp in seconds
 * @returns {Object} returns timestamp before the change and updated timestamp
 */
async function timeTravel(vnetId, timeIncrease) {
    hre.ethers.provider = hre.ethers.getDefaultProvider(vnetId);

    const oldTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    await hre.ethers.provider.send("evm_increaseTime", [timeIncrease]);
    const newTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    return { oldTimestamp, newTimestamp };
}

/**
 * Sets timestamp on a given vnet to a specific value
 * @param {string} vnetId RPC URL of the Tenderly vnet
 * @param {number} timestamp Unix timestamp to set the blockchain time to
 * @returns {Object} returns timestamp before the change and updated timestamp
 */
async function setTime(vnetId, timestamp) {
    hre.ethers.provider = hre.ethers.getDefaultProvider(vnetId);

    const oldTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]); // Convert to milliseconds
    await hre.ethers.provider.send("evm_mine", []);

    const newTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    return { oldTimestamp, newTimestamp };
}

/**
 * Creates a new Tenderly vnet in defisaver-v2 organisation using provided input
 * @param {string} tenderlyProject name of the Tenderly project
 * @param {string} tenderlyAccessKey access key for Tenderly project
 * @param {number} chainId ID that represents which chain we want to use
 * @param {number} [startFromBlock] block number to start the vnet from
 * @returns {Promise<{vnetId: *, blockNumber: *, newAccount: *}>} RPC URL used as vnet id
 */
async function createNewVnet(tenderlyProject, tenderlyAccessKey, chainId, startFromBlock) {
    const body = {
        slug: uuid(),
        display_name: "DeFi Saver Simulation",
        fork_config: {
            network_id: +chainId,
            block_number: startFromBlock || "latest"
        },
        virtual_network_config: {
            chain_config: {
                chain_id: +chainId
            }
        },
        sync_state_config: {
            enabled: false
        },
        explorer_page_config: {
            enabled: true,
            verification_visibility: "src"
        }
    };

    const headers = getHeaders(tenderlyAccessKey);

    const forkRes = await axios.post(`https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/vnets`, body, { headers });

    const {
        rpcs,
        virtual_network_config: {
            accounts: [
                { address: newAccount }
            ]
        },
        fork_config: {
            block_number: blockNumberHex
        }
    } = forkRes.data;

    // DEV endpoints returns 4 RPCs (2 HTTP, 2 WS), 3rd one is public, 1st one is admin (redirects to public)
    const adminEndpoint = rpcs.find(e => e.name === "Admin RPC");

    if (!adminEndpoint) {
        throw new Error("Error returning vnet HTTP endpoint");
    }
    const vnetId = adminEndpoint.url; // Using RPC URL as vnetId
    const blockNumber = parseInt(blockNumberHex, 16);

    return { vnetId, blockNumber, newAccount };
}

/**
 * Clones an existing Tenderly vnet in defisaver-v2 organisation using provided input
 * @param {string} cloningVnetId vnet ID of an existing vnet
 * @param {string} tenderlyProject name of the Tenderly project
 * @param {string} tenderlyAccessKey access key for Tenderly project
 * @returns {Promise<string>} RPC URL used as vnet id
 */
async function cloneVnet(cloningVnetId, tenderlyProject, tenderlyAccessKey) {
    const url = `https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/testnet/clone`;

    // eslint-disable-next-line camelcase
    const body = {
        srcContainerId: cloningVnetId,
        dstContainerDisplayName: ""
    };
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(url, body, { headers });

    const vnetId = forkRes.data.container.connectivityConfig.endpoints[0].id;
    const rpc = `https://virtual.mainnet.rpc.tenderly.co/${vnetId}`;

    return rpc;
}

/**
 * Creates a new Ethereum address
 * @returns {string} Newly created Ethereum address
 */
async function newAddress() {
    return hre.ethers.Wallet.createRandom().address;
}

module.exports = {
    createNewVnet,
    cloneVnet,
    topUpOwner,
    topUpAccount,
    setUpBotAccounts,
    timeTravel,
    setTime,
    newAddress
};
