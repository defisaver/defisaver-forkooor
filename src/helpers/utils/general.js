const hre = require('hardhat');
const axios = require('axios');
const storageSlots = require('../../storageSlots.json');

const { botAuthAbi, iProxyERC20Abi, erc20Abi } = require('../../abi/general');
const { getHeaders, addresses, getAddrFromRegistry, toBytes32 } = require('../../utils');

const topUpAccount = async(forkId, address, amount) => {
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const weiAmount = hre.ethers.utils.parseUnits(amount.toString(), 18);
    const weiAmountInHexString = weiAmount.toHexString();

    await hre.ethers.provider.send("tenderly_setBalance", [
        [address],
        //amount in wei will be set for all wallets
        hre.ethers.utils.hexValue(weiAmountInHexString),
      ]);

    const newBalance = await hre.ethers.provider.getBalance(address);

    if (newBalance.toString() !== weiAmount.toString()) throw new Error(`Failed to update balance, balance now : ${newBalance}`);
};

const topUpOwner = async(forkId) => {
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const { chainId } = await hre.ethers.provider.getNetwork();
    const owner = addresses[chainId].OWNER_ACC;
    await topUpAccount(forkId, owner, 100);
}

const setUpBotAccounts = async (forkId, botAccounts) => {
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const { chainId } = await hre.ethers.provider.getNetwork();
    if (!botAccounts) {
        botAccounts = [];
    }
    for (let i = 0; i < botAccounts.length; i++) {
        const botAddr = botAccounts[i];
        // eslint-disable-next-line no-await-in-loop
        await topUpAccount(forkId, botAddr, 1000);
        // eslint-disable-next-line no-await-in-loop
        await addBotCaller(botAddr, chainId);
    }
}

const addBotCaller = async (
    botAddr,
    chainId
) => {
    const signer = await hre.ethers.provider.getSigner(addresses[chainId].OWNER_ACC);
    const botAuthAddr = await getAddrFromRegistry('BotAuth');
    const botAuth = new hre.ethers.Contract(botAuthAddr, botAuthAbi, signer);
    await botAuth.addCaller(botAddr, { gasLimit: 800000 });
};

const setBalance = async (forkId, tokenAddr, userAddr, amount) => {
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const { chainId } = await hre.ethers.provider.getNetwork();

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
        throw new Error("Token balance not changeable : " + inputTokenAddr + " - " + chainId);
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

const timeTravel = async (forkId, timeIncrease) => {
    hre.ethers.provider = hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);

    const oldTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
    await hre.ethers.provider.send('evm_increaseTime', [timeIncrease]);
    await hre.ethers.provider.send('evm_mine', []); // Just mines to the next block
    const newTimestamp = (await hre.ethers.provider.getBlock("latest")).timestamp;

    return { oldTimestamp, newTimestamp };
};

const createNewFork = async(tenderlyProject, tenderlyAccessKey, chainId) => {
    const body = { network_id: chainId };
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(`https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/fork`, body, { headers });
    return forkRes.data.simulation_fork.id;
}

const cloneFork = async(cloningForkId, tenderlyProject, tenderlyAccessKey) => {
    const url = `https://api.tenderly.co/api/v1/account/defisaver-v2/project/${tenderlyProject}/clone-fork`
    
    const body = { fork_id : cloningForkId};
    const headers = getHeaders(tenderlyAccessKey);
    const forkRes = await axios.post(url, body, { headers });

    return forkRes.data.simulation_fork.id;
}

module.exports = {
    createNewFork,
    cloneFork,
    topUpOwner,
    topUpAccount,
    setUpBotAccounts,
    setBalance,
    timeTravel,
}