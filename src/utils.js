const hre = require('hardhat');

const { dfsRegistryAbi, proxyRegistryAbi, proxyAbi, erc20Abi } = require('./abi/general');

const nullAddress = '0x0000000000000000000000000000000000000000';

const addresses = {
    1: {
        REGISTRY_ADDR: '0x287778F121F134C66212FB16c9b53eC991D32f5b',
        OWNER_ACC: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        PROXY_REGISTRY: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'
    },
    10: {
        REGISTRY_ADDR: '0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd',
        OWNER_ACC: '0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33',
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895'
    },
    42161: {
        REGISTRY_ADDR: '0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA',
        OWNER_ACC: '0x926516E60521556F4ab5e7BF16A4d41a8539c7d1',
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895'
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

const getAddrFromRegistry = async (name) => {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const registry = new hre.ethers.Contract(addresses[chainId].REGISTRY_ADDR, dfsRegistryAbi, signer);
    const addr = await registry.getAddr(
        getNameId(name),
    );
    return addr;
};

const getProxy = async (acc) => {
    const accSigner = await hre.ethers.getSigner(acc);
    const { chainId } = await hre.ethers.provider.getNetwork();
    const [signer] = await hre.ethers.getSigners();
    let proxyRegistryContract = new hre.ethers.Contract(addresses[chainId].PROXY_REGISTRY, proxyRegistryAbi, signer);
    let proxyAddr = await proxyRegistryContract.proxies(acc);
    
    if (proxyAddr === nullAddress) {
        proxyRegistryContract = await proxyRegistryContract.connect(accSigner)
        await proxyRegistryContract.build(acc);
        proxyAddr = await proxyRegistryContract.proxies(acc);
    }
    const dsProxy = new hre.ethers.Contract(proxyAddr, proxyAbi, accSigner);
    
    return dsProxy;
};

const approve = async (tokenAddr, to, signer) => {
    const accSigner = await hre.ethers.getSigner(signer);
    const tokenContract = new hre.ethers.Contract(tokenAddr, erc20Abi, accSigner);

    const allowance = await tokenContract.allowance(signer, to);

    if (allowance.toString() === '0') {
        const tokenContractSigner = tokenContract.connect(accSigner);
        await tokenContractSigner.approve(to, hre.ethers.constants.MaxUint256, { gasLimit: 1000000 });
    }
}

const executeAction = async (actionName, functionData, proxy) => {
    const actionAddr = await getAddrFromRegistry(actionName);
    receipt = await proxy['execute(address,bytes)'](actionAddr, functionData, {gasLimit: 10000000});
}

const toBytes32 = (bn) => hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(bn.toHexString(), 32));

module.exports = {
    addresses,
    getHeaders,
    getNameId,
    getAddrFromRegistry,
    toBytes32,
    getProxy,
    approve,
    executeAction
}