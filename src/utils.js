const hre = require("hardhat");

const { dfsRegistryAbi, proxyRegistryAbi, proxyAbi, erc20Abi } = require("./abi/general");

const nullAddress = "0x0000000000000000000000000000000000000000";

const addresses = {
    1: {
        REGISTRY_ADDR: "0x287778F121F134C66212FB16c9b53eC991D32f5b",
        OWNER_ACC: "0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00",
        PROXY_REGISTRY: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4"
    },
    10: {
        REGISTRY_ADDR: "0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd",
        OWNER_ACC: "0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895"
    },
    42161: {
        REGISTRY_ADDR: "0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA",
        OWNER_ACC: "0x926516E60521556F4ab5e7BF16A4d41a8539c7d1",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895"
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
    const { chainId } = await hre.ethers.provider.getNetwork();
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
    const { chainId } = await hre.ethers.provider.getNetwork();
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

        await tokenContractSigner.approve(to, hre.ethers.constants.MaxUint256, { gasLimit: 1000000 });
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

    await proxy["execute(address,bytes)"](actionAddr, functionData, { gasLimit: 10000000 });
}

/**
 * Convert BigNumber to bytes32
 * @param {BigNumber} bn BigNumber that we want to represent in bytes32
 * @returns {string} bytes32 representation of a given BigNumber
 */
function toBytes32(bn) {
    return hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(bn.toHexString(), 32));
}

module.exports = {
    addresses,
    getHeaders,
    getNameId,
    getAddrFromRegistry,
    toBytes32,
    getProxy,
    approve,
    executeAction
};
