const hre = require('hardhat');
const axios = require('axios');

const { botAuthAbi, dfsRegistryAbi } = require('./abi/utils-abi');

const headers = {
    'Content-Type': 'application/json',
    'X-Access-Key': process.env.TENDERLY_ACCESS_KEY,
};

const addresses = {
    1: {
        PROXY_REGISTRY: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
        REGISTRY_ADDR: '0x287778F121F134C66212FB16c9b53eC991D32f5b',
        PROXY_AUTH_ADDR: '0x149667b6FAe2c63D1B4317C716b0D0e4d3E2bD70',
        OWNER_ACC: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        WETH_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        DAI_ADDRESS: '0x6b175474e89094c44da98b954eedeac495271d0f',
        TOKEN_GROUP_REGISTRY: '0xcA49e64FE1FE8be40ED30F682edA1b27a6c8611c',
        FEE_RECEIVER: '0x6467e807dB1E71B9Ef04E0E3aFb962E4B0900B2B',
        USDC_ADDR: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        EXCHANGE_OWNER_ADDR: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        SAVER_EXCHANGE_ADDR: '0x25dd3F51e0C3c3Ff164DDC02A8E4D65Bb9cBB12D',
        StrategyProxy: '0x0822902D30CC9c77404e6eB140dC1E98aF5b559A',
        SubProxy: '0xd18d4756bbf848674cc35f1a0B86afEF20787382',
        UNISWAP_WRAPPER: '0x6cb48F0525997c2C1594c89e0Ca74716C99E3d54',
        FEED_REGISTRY: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
        COMET_USDC_ADDR: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        COMET_USDC_REWARDS_ADDR: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        COMP_ADDR: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        CHICKEN_BONDS_VIEW: '0x809a93fd4a0d7d7906Ef6176f0b5518b418Da08f',
        AVG_GAS_PRICE: 100,

    },
    10: {
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895',
        REGISTRY_ADDR: '0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd',
        OWNER_ACC: '0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33',
        WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
        DAI_ADDRESS: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDC_ADDR: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        EXCHANGE_OWNER_ADDR: '0xc9a956923bfb5f141f1cd4467126b3ae91e5cc33',
        SAVER_EXCHANGE_ADDR: '0xFfE2F824f0a1Ca917885CB4f848f3aEf4a32AaB9',
        PROXY_AUTH_ADDR: '0xD6ae16A1aF3002D75Cc848f68060dE74Eccc6043',
        AAVE_MARKET: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
        StrategyProxy: '0xEe0C404FD30E289c305E760b3AE1d1Ae6503350f',
        SubProxy: '0x163c08d3F6d916AD6Af55b37728D547e968103F8',
        UNISWAP_WRAPPER: '0xc6F57b45c20aE92174b8B7F86Bb51A1c8e4AD357',
        AAVE_V3_VIEW: '0x5aD16e393615bfeF64e15210C370dd4b8f2753Cb',
        AVG_GAS_PRICE: 0.001,
        TOKEN_GROUP_REGISTRY: '0x566b2a957D8FCE39D2744059d558F27aF52a70c0',
    },
    42161: {
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895',
        REGISTRY_ADDR: '0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA',
        OWNER_ACC: '0x926516E60521556F4ab5e7BF16A4d41a8539c7d1',
        WETH_ADDRESS: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        DAI_ADDRESS: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDC_ADDR: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        EXCHANGE_OWNER_ADDR: '0x322d58b9E75a6918f7e7849AEe0fF09369977e08',
        SAVER_EXCHANGE_ADDR: '0xaB1E4b72BC2f3890F052df111EE626c1c7229F26',
        FEE_RECEIVER: '0xe000e3c9428D539566259cCd89ed5fb85e655A01',
        TOKEN_GROUP_REGISTRY: '0xb03fe103f54841821C080C124312059c9A3a7B5c',
        PROXY_AUTH_ADDR: '0xF3A8479538319756e100C386b3E60BF783680d8f',
        AAVE_MARKET: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
        SubProxy: '0x275A8f98dBA07Ad6380D3ea3F36B665DD6E02F25',
        StrategyProxy: '0x8F62B8Cd1189dB92ba4CBd4dBE64D03C54fD079B',
        AAVE_V3_VIEW: '0x710f01037018Daad969B8FeFe69b4823Ef788bc6',
        UNISWAP_WRAPPER: '0x48ef488054b5c570cf3a2ac0a0697b0b0d34c431',
        AVG_GAS_PRICE: 0.5,
    }
};

const getNameId = (name) => {
    const hash = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(name));

    return hash.substr(0, 10);
};

const topUpBotAccounts = async (botAccounts, chainId, forkId) => {
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    for (let i = 0; i < botAccounts.length; i++) {
        const botAddr = botAccounts[i];
        // eslint-disable-next-line no-await-in-loop
        await topUpAccount(botAddr, forkId);
        // eslint-disable-next-line no-await-in-loop
        await addBotCaller(botAddr, chainId);
    }
}

const topUpAccount = async(address, forkId) => {
    const body = { accounts: [address], amount: 1000000 };
    await axios.post(`https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/fork/${forkId}/balance`, body, { headers });
}

const topUpOwner = async(chainId, forkId) => {
    const owner = addresses[chainId].OWNER_ACC;
    await topUpAccount(owner, forkId);
}

const addBotCaller = async (
    botAddr,
    chainId
) => {
    const signer = await hre.ethers.provider.getSigner(addresses[chainId].OWNER_ACC);
    const botAuthAddr = await getAddrFromRegistry('BotAuth', chainId);
    const botAuth = new hre.ethers.Contract(botAuthAddr, botAuthAbi, signer);
    await botAuth.addCaller(botAddr, { gasLimit: 800000 });
};

const getAddrFromRegistry = async (name, chainId) => {
    const [signer] = await hre.ethers.getSigners();
    const registry = new hre.ethers.Contract(addresses[chainId].REGISTRY_ADDR, dfsRegistryAbi, signer);
    const addr = await registry.getAddr(
        getNameId(name),
    );
    return addr;
};


module.exports = {
    headers,
    addresses,
    topUpBotAccounts,
    topUpAccount,
    getAddrFromRegistry,
    topUpOwner,
}