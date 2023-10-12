const hre = require("hardhat");

const {
    dfsRegistryAbi, proxyRegistryAbi, proxyAbi, erc20Abi, iProxyERC20Abi, subProxyAbi, subStorageAbi,
} = require("./abi/general");
const {sparkSubProxyAbi} = require("./abi/spark/abis");

const storageSlots = require("../src/storageSlots.json");
const {aaveV3SubProxyAbi} = require("./abi/aaveV3/abis");
const {mcdSubProxyAbi} = require("./abi/maker/views");

const nullAddress = "0x0000000000000000000000000000000000000000";

const addresses = {
    1: {
        REGISTRY_ADDR: "0x287778F121F134C66212FB16c9b53eC991D32f5b",
        OWNER_ACC: "0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00",
        PROXY_REGISTRY: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
        SUB_PROXY: "0xd18d4756bbf848674cc35f1a0b86afef20787382",
        DAI_ADDR: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        SPARK_SUB_PROXY: "0x3730bb1f58087D02Ccf7E0B6696755f588E17A03",
        AAVE_V3_SUB_PROXY: "0xb9F73625AA64D46A9b2f0331712e9bEE19e4C3f7",
        MCD_SUB_PROXY: "0xDED2752728227c502E08e51023b1cE0a37F907A2"
    },
    10: {
        REGISTRY_ADDR: "0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd",
        OWNER_ACC: "0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895",
        SUB_PROXY: "0x163c08d3F6d916AD6Af55b37728D547e968103F8",
        DAI_ADDR: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
    },
    42161: {
        REGISTRY_ADDR: "0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA",
        OWNER_ACC: "0x926516E60521556F4ab5e7BF16A4d41a8539c7d1",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895",
        SUB_PROXY: "0x275A8f98dBA07Ad6380D3ea3F36B665DD6E02F25",
        DAI_ADDR: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
    }
};

/**
 * Create a headers object needed for tenderly API
 * @param {string} tenderlyAccessKey access key for tenderly
 * @returns {Object} returns a headers object needed when calling tenderly endpoints
 */
function getHeaders(tenderlyAccessKey) {
    return {
        "Content-Type": "application/json",
        "X-Access-Key": tenderlyAccessKey
    };
}

/**
 * Get action ID for the DFSRegistry by hashing contract name
 * @param {string} name name of the contract
 * @returns {string} bytes4 representation of actionId
 */
function getNameId(name) {
    const hash = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(name));

    return hash.slice(0, 10);
}

/**
 * Fetch a DFS Action address from the registry by it's name
 * @param {string} name name of the Action in registry
 * @returns {string} Address of the action contract
 */
async function getAddrFromRegistry(name) {
    const [signer] = await hre.ethers.getSigners();
    const {chainId} = await hre.ethers.provider.getNetwork();
    const registry = new hre.ethers.Contract(addresses[chainId].REGISTRY_ADDR, dfsRegistryAbi, signer);
    const addr = await registry.getAddr(
        getNameId(name)
    );

    return addr;
}

/**
 * Get an existing or build a new Proxy ethers.Contract object for an EOA
 * @param {string} account proxy owner
 * @returns {Object} DSProxy ethers.Contract object
 */
async function getProxy(account) {
    const accSigner = await hre.ethers.getSigner(account);
    const {chainId} = await hre.ethers.provider.getNetwork();
    const [signer] = await hre.ethers.getSigners();
    let proxyRegistryContract = new hre.ethers.Contract(addresses[chainId].PROXY_REGISTRY, proxyRegistryAbi, signer);
    let proxyAddr = await proxyRegistryContract.proxies(account);

    if (proxyAddr === nullAddress) {
        proxyRegistryContract = await proxyRegistryContract.connect(accSigner);
        await proxyRegistryContract.build(account);
        proxyAddr = await proxyRegistryContract.proxies(account);
    }
    const dsProxy = new hre.ethers.Contract(proxyAddr, proxyAbi, accSigner);

    return dsProxy;
}

/**
 * Check if an address is a contract
 * @param {string} address proxy owner
 * @returns {Object} true if address is a contract
 */
async function isContract(address) {
    const code = await hre.ethers.provider.getCode(address);

    return code !== "0x";
}

/**
 * Get sender account and his proxy
 * @param {string} owner the EOA which will be sending transactions and own the newly created vault
 * @returns {Object} object that has sender account and his proxy
 */
async function getSender(owner) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address);

    return [
        senderAcc,
        proxy
    ];
}

/**
 * Give unlimited approval for ERC20 token transfers
 * @param {string} tokenAddr address of the ERC20 token
 * @param {string} to address of the token spender
 * @param {string} owner adddress of the token owner
 * @returns {void}
 */
async function approve(tokenAddr, to, owner) {
    const accSigner = await hre.ethers.getSigner(owner);
    const tokenContract = new hre.ethers.Contract(tokenAddr, erc20Abi, accSigner);

    const allowance = await tokenContract.allowance(owner, to);

    if (allowance.toString() === "0") {
        const tokenContractSigner = tokenContract.connect(accSigner);

        await tokenContractSigner.approve(to, hre.ethers.constants.MaxUint256, {gasLimit: 1000000});
    }
}

/**
 * Util function for invoking an action via DSProxy
 * @param {string} actionName name of the Contract we're invoking via proxy
 * @param {string} functionData dfs sdk action encoded for proxy
 * @param {Object} proxy DSProxy ethers.Contract object
 * @returns {void}
 */
async function executeAction(actionName, functionData, proxy) {
    const actionAddr = await getAddrFromRegistry(actionName);

    await proxy["execute(address,bytes)"](actionAddr, functionData, {gasLimit: 10000000})
        .then(e => e.wait());
}

/**
 * Convert BigNumber to bytes32
 * @param {BigNumber} bn BigNumber that we want to represent in bytes32
 * @returns {string} bytes32 representation of a given BigNumber
 */
function toBytes32(bn) {
    return hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(bn.toHexString(), 32));
}

/**
 * Sets ETH balance of a given address to desired amount on a tenderly fork
 * @param {string} address address whose balance we want to top up
 * @param {integer} amount amount of ETH to top up the address with (whole number)
 * @returns {void}
 */
async function topUpAccount(address, amount) {
    const weiAmount = hre.ethers.utils.parseUnits(amount.toString(), 18);
    const weiAmountInHexString = weiAmount.toHexString();

    await hre.ethers.provider.send("tenderly_setBalance", [
        [address],

        // amount in wei will be set for all wallets
        hre.ethers.utils.hexValue(weiAmountInHexString)
    ]);

    const newBalance = await hre.ethers.provider.getBalance(address);

    if (newBalance.toString() !== weiAmount.toString()) {
        throw new Error(`Failed to update balance, balance now : ${newBalance}`);
    }
}

/**
 * Sets up hre.ethers.providers object and gives 100 eth to each account
 * @param {string} forkId ID of the tenderly fork
 * @param {Array<string>} accounts all the accounts that will be sending transactions
 * @returns {void}
 */
async function setupFork(forkId, accounts = []) {
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    await Promise.all(accounts.map(async (account) => {
        await topUpAccount(account, 100);
    }));
}

/**
 * Grants a desired token balance to an address
 * @param {string} tokenAddr address of the ERC20 token
 * @param {string} userAddr address which we want to receive the desired amount of tokens
 * @param {number} amount new balance to set in decimal numbers (not wei)
 * @returns {void}
 */
async function setBalance(tokenAddr, userAddr, amount) {
    const {chainId} = await hre.ethers.provider.getNetwork();

    const [signer] = await hre.ethers.getSigners();

    const erc20 = new hre.ethers.Contract(tokenAddr, erc20Abi, signer);

    const decimals = await erc20.decimals();
    const value = hre.ethers.utils.parseUnits(amount.toString(), decimals);
    const inputTokenAddr = tokenAddr;

    try {

        let tokenContract = new hre.ethers.Contract(tokenAddr, iProxyERC20Abi, signer);
        const newTokenAddr = await tokenContract.callStatic.target();

        tokenContract = new hre.ethers.Contract(newTokenAddr, iProxyERC20Abi, signer);
        const tokenState = await tokenContract.callStatic.tokenState();

        // eslint-disable-next-line no-param-reassign
        tokenAddr = tokenState;
        // eslint-disable-next-line no-empty, no-unused-vars
    } catch (error) {
    }
    const slotObj = storageSlots[chainId][tokenAddr.toString().toLowerCase()];

    if (!slotObj) {
        throw new Error(`Token balance not changeable : ${inputTokenAddr} - ${chainId}`);
    }
    const slotInfo = {isVyper: slotObj.isVyper, num: slotObj.num};
    let index;

    if (slotInfo.isVyper) {
        index = hre.ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [slotInfo.num, userAddr] // key, slot
        );
    } else {
        index = hre.ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [userAddr, slotInfo.num] // key, slot
        );
    }
    await hre.ethers.provider.send("tenderly_setStorageAt", [tokenAddr, index.toString(), toBytes32(value).toString()]);
    await hre.ethers.provider.send("evm_mine", []); // Just mines to the next block
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
    const {chainId} = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, subProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subscribeToStrategy",
        [strategySub]
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    }).then(e => e.wait());

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribe to a strategy using SparkSubProxy
 * @param {string} proxy proxy Object which we want to use for sub
 * @param {string} strategySub strategySub properly encoded
 * @returns {number} ID of the strategy subscription
 */
async function subToSparkStrategy(proxy, strategySub) {
    const {chainId} = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].SPARK_SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, sparkSubProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToSparkAutomation",
        [strategySub]
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    }).then(e => e.wait());

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribe to a strategy using AaveV3SubProxy
 * @param {string} proxy owner's proxy address
 * @param {string} strategySub strategySub properly encoded
 * @returns {number} ID of the subscription
 */
async function subToAaveV3Automation(proxy, strategySub) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].AAVE_V3_SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, aaveV3SubProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToAaveAutomation",
        [strategySub]
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    }).then(e => e.wait());

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribe to a strategy using MCDSubProxy
 * @param {string} proxy owner's proxy address
 * @param {string} strategySub strategySub properly encoded
 * @returns {number} ID of the subscription
 */
async function subToMcdAutomation(proxy, strategySub) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].MCD_SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, mcdSubProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToMcdAutomation",
        [strategySub, false],
    );

    await proxy["execute(address,bytes)"](subProxyAddr, functionData, {
        gasLimit: 5000000
    }).then(e => e.wait());

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

module.exports = {
    addresses,
    getHeaders,
    getNameId,
    getAddrFromRegistry,
    toBytes32,
    getProxy,
    approve,
    executeAction,
    topUpAccount,
    setupFork,
    setBalance,
    subToStrategy,
    getLatestSubId,
    getSender,
    subToSparkStrategy,
    subToAaveV3Automation,
    subToMcdAutomation,
    isContract
};
