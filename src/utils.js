const hre = require('hardhat');

const { dfsRegistryAbi } = require('./abi/utils');

const addresses = {
    1: {
        REGISTRY_ADDR: '0x287778F121F134C66212FB16c9b53eC991D32f5b',
        OWNER_ACC: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
    },
    10: {
        REGISTRY_ADDR: '0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd',
        OWNER_ACC: '0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33',
    },
    42161: {
        REGISTRY_ADDR: '0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA',
        OWNER_ACC: '0x926516E60521556F4ab5e7BF16A4d41a8539c7d1',
    }
};

const getHeaders = (tenderlyAccessKey) => {
    return {
        'Content-Type': 'application/json',
        'X-Access-Key': tenderlyAccessKey
    };
}

const getNameId = (name) => {
    const hash = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(name));
    return hash.substr(0, 10);
};

const getAddrFromRegistry = async (name, chainId) => {
    const [signer] = await hre.ethers.getSigners();
    const registry = new hre.ethers.Contract(addresses[chainId].REGISTRY_ADDR, dfsRegistryAbi, signer);
    const addr = await registry.getAddr(
        getNameId(name),
    );
    return addr;
};

const toBytes32 = (bn) => hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(bn.toHexString(), 32));

module.exports = {
    addresses,
    getHeaders,
    getNameId,
    getAddrFromRegistry,
    toBytes32,
}