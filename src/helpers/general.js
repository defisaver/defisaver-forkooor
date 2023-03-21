const hre = require('hardhat');
const axios = require('axios');
const storageSlots = require('../storageSlots.json');

const { botAuthAbi, iProxyERC20Abi, erc20Abi } = require('../abi/utils');
const { getHeaders, addresses, getAddrFromRegistry, toBytes32 } = require('../utils');

const getChainId = async (forkId, tenderlyAccessKey) => {
    const url = 'https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/fork/' + forkId;
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.get(url, {headers});
    return forkRes.data.simulation_fork.network_id;
}

const topUpAccount = async(forkId, tenderlyAccessKey, address, amount, ) => {
    headers = getHeaders(tenderlyAccessKey);
    const body = { accounts: [address], amount: amount };
    await axios.post(`https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/fork/${forkId}/balance`, body, { headers });
}

const topUpOwner = async(forkId, tenderlyAccessKey) => {
    const chainId = await getChainId(forkId, tenderlyAccessKey);
    const owner = addresses[chainId].OWNER_ACC;
    await topUpAccount(forkId, tenderlyAccessKey, owner, 100);
}

const setUpBotAccounts = async (forkId, tenderlyAccessKey, botAccounts) => {
    const chainId = await getChainId(forkId, tenderlyAccessKey);
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    for (let i = 0; i < botAccounts.length; i++) {
        const botAddr = botAccounts[i];
        // eslint-disable-next-line no-await-in-loop
        await topUpAccount(forkId, tenderlyAccessKey, botAddr, 1000);
        // eslint-disable-next-line no-await-in-loop
        await addBotCaller(botAddr, chainId);
    }
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

const setBalance = async (forkId, tenderlyAccessKey, tokenAddr, userAddr, amount) => {
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const chainId = await getChainId(forkId, tenderlyAccessKey);
    const [signer] = await hre.ethers.getSigners();

    const erc20 = new hre.ethers.Contract(tokenAddr, erc20Abi, signer);

    const decimals = await erc20.decimals();
    const value = hre.ethers.utils.parseUnits(amount.toString(), decimals);
    const inputTokenAddr = tokenAddr;
    try {
        const [signer] = await hre.ethers.getSigners();

        let tokenContract = new hre.ethers.Contract(tokenAddr, iProxyERC20Abi, signer);
        const newTokenAddr = await tokenContract.callStatic.target();

        tokenContract = new hre.ethers.Contract(newTokenAddr, iProxyERC20Abi, signer);
        const tokenState = await tokenContract.callStatic.tokenState();
        // eslint-disable-next-line no-param-reassign
        tokenAddr = tokenState;
    // eslint-disable-next-line no-empty
    } catch (error) {
    }
    const slotObj = storageSlots[chainId][tokenAddr.toString().toLowerCase()];
    if (!slotObj) {
        return ("Token balance not changeable : " + inputTokenAddr + " - " + chainId);
    }
    const slotInfo = { isVyper: slotObj.isVyper, num: slotObj.num };
    let index;
    if (slotInfo.isVyper) {
        index = hre.ethers.utils.solidityKeccak256(
            ['uint256', 'uint256'],
            [slotInfo.num, userAddr], // key, slot
        );
    } else {
        index = hre.ethers.utils.solidityKeccak256(
            ['uint256', 'uint256'],
            [userAddr, slotInfo.num], // key, slot
        );
    }
    while (index.startsWith('0x0')) { index = `0x${index.slice(3)}`; }

    await hre.ethers.provider.send('tenderly_setStorageAt', [tokenAddr, index.toString(), toBytes32(value).toString()]);
    await hre.ethers.provider.send('evm_mine', []); // Just mines to the next block
}

const createNewFork = async(tenderlyAccessKey, chainId) => {
    const body = { network_id: chainId };
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post('https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/fork', body, { headers });
    return forkRes.data.simulation_fork.id;
}

const cloneFork = async(cloningForkId, tenderlyAccessKey) => {
    const url = 'https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/clone-fork'
    
    const body = { fork_id : cloningForkId};
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(url, body, { headers });

    return forkRes.data.simulation_fork.id;
}

const timeTravel = async (forkId, timeIncrease) => {
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    
    await hre.ethers.provider.send('evm_increaseTime', [timeIncrease]);
    await hre.ethers.provider.send('evm_mine', []); // Just mines to the next block
};


module.exports = {
    createNewFork,
    cloneFork,
    topUpOwner,
    topUpAccount,
    setUpBotAccounts,
    setBalance,
    timeTravel,
}