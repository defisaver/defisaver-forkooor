const hre = require("hardhat");

const {
    dfsRegistryAbi, proxyRegistryAbi, proxyAbi, erc20Abi, iProxyERC20Abi, subProxyAbi, subStorageAbi, safeProxyFactoryAbi,
    safeAbi
} = require("./abi/general");
const { sparkSubProxyAbi } = require("./abi/spark/abis");

const storageSlots = require("../src/storageSlots.json");
const { aaveV3SubProxyAbi } = require("./abi/aaveV3/abis");
const { mcdSubProxyAbi } = require("./abi/maker/views");
const { liquityLeverageManagementSubProxyAbi } = require("./abi/liquity/abis");

const SAFE_PROXY_FACTORY_ADDR = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const SAFE_SINGLETON_ADDR = "0x41675C099F32341bf84BFc5382aF534df5C7461a";

const addresses = {
    1: {
        REGISTRY_ADDR: "0x287778F121F134C66212FB16c9b53eC991D32f5b",
        OWNER_ACC: "0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00",
        PROXY_REGISTRY: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
        SUB_PROXY: "0x88B8cEb76b88Ee0Fb7160E6e2Ad86055a32D72d4",
        DAI_ADDR: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        SPARK_SUB_PROXY: "0xb6F2FC4039aBB60Cd38a2489A2299366cdb037ae",
        AAVE_V3_SUB_PROXY: "0x7D2250A5CC1b32670d23FcA14D08fF3dC6230f96",
        MCD_SUB_PROXY: "0xc044477E9a70a6aFbeDA3B33163710B7fc557eB2",
        COMP_V3_VIEW: "0x566b1Bd61E4C164DC22f51883942655DaA7Ea297",
        COMP_V3_SUB_PROXY: "0xf8ED16738cEf95c89F4Ff4790d78F295488f6078",
        LIQUITY_LEVERAGE_MANAGEMENT_SUB_PROXY: "0xE2f4A4629FbbC444964A16438329288C66551c30",
        AAVE_V3_VIEW: "0x23Ef4A553fC2Af2784A5bF8CE4345D1f0A355A15",
        AAVE_V3_MARKET: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
        MORPHO_BLUE_VIEW: "0x10B621823D4f3E85fBDF759e252598e4e097C1fd",
        MORPHO_BLUE: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
        CURVE_USD_VIEW: "0x4bbcf0e587853aaedfc3e60f74c10e07d8dea701"
    },
    10: {
        REGISTRY_ADDR: "0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd",
        OWNER_ACC: "0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895",
        SUB_PROXY: "0xFF9f0B8d0a4270f98C52842d163fd34728109692",
        DAI_ADDR: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        AAVE_V3_SUB_PROXY: "0xa950a534a6AB01D1FF5C6C82E5E7F515c19500e9",
        AAVE_V3_VIEW: "0xf56A2A8fA68D2E608ED7060BE55e96E008dCc3ca",
        AAVE_V3_MARKET: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"
    },
    42161: {
        REGISTRY_ADDR: "0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA",
        OWNER_ACC: "0x926516E60521556F4ab5e7BF16A4d41a8539c7d1",
        PROXY_REGISTRY: "0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895",
        SUB_PROXY: "0x2edB8eb14e29F3CF0bd50958b4664C9EB1583Ec9",
        DAI_ADDR: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        COMP_V3_VIEW: "0xdaAFACe18f75D941041Eef575255A41fdBC50a17",
        COMP_V3_SUB_PROXY: "0x398129ee7b6B5F62F896998E036Ebb3032451f03",
        AAVE_V3_SUB_PROXY: "0x967b6dFd1485C30521F8311e39E60B9c4D4b6Dbf",
        AAVE_V3_VIEW: "0x94A36080FaE0e22977aA4928d3D5C733Be744DF1",
        AAVE_V3_MARKET: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"
    }
};

/**
 * Returns true if the proxy is a Safe Smart wallet
 * @param {Object} proxy a proxy object
 * @returns {boolean} true if the proxy is a Safe Smart wallet
 */
function isProxySafe(proxy) {
    return proxy.functions.nonce;
}

/** Create a new Safe for the senderAddress
 * @param {string} senderAddress account that will be the owner of the safe
 * @returns {string} created safe address
 */
async function createSafe(senderAddress) {
    const abiCoder = new hre.ethers.utils.AbiCoder();

    const safeProxyFactory = await hre.ethers.getContractAt(safeProxyFactoryAbi, SAFE_PROXY_FACTORY_ADDR);

    const saltNonce = Date.now();
    const setupData = [
        [senderAddress], // owner
        1, // threshold
        hre.ethers.constants.AddressZero, // to module address
        [], // data for module
        hre.ethers.constants.AddressZero, // fallback handler
        hre.ethers.constants.AddressZero, // payment token
        0, // payment
        hre.ethers.constants.AddressZero // payment receiver
    ];

    const safeInterface = await hre.ethers.getContractAt(safeAbi, SAFE_SINGLETON_ADDR);
    const functionData = safeInterface.interface.encodeFunctionData(
        "setup",
        setupData
    );

    const accSigner = await hre.ethers.getSigner(senderAddress);

    let receipt = await safeProxyFactory.connect(accSigner).createProxyWithNonce(
        SAFE_SINGLETON_ADDR,
        functionData,
        saltNonce
    );

    receipt = await receipt.wait();

    // fetch deployed safe addr
    const safeAddr = abiCoder.decode(["address"], receipt.events.reverse()[0].topics[1]);

    return safeAddr[0];
}

/**
 * Executes 1/1 safe tx without sig
 * @param {Object} safeInstance safe object instance
 * @param {string} targetAddr target contract address for execution
 * @param {Object} calldata calldata to send to target address
 * @param {number} callType type of call (1 for delegateCall, 0 for call). Default to DelegateCall
 * @param {number} ethValue eth value to send. Defaults to 0
 * @returns {void}
 */
async function executeSafeTx(
    safeInstance,
    targetAddr,
    calldata,
    callType = 1,
    ethValue = 0
) {
    const abiCoder = new hre.ethers.utils.AbiCoder();

    const nonce = await safeInstance.nonce();

    const txHash = await safeInstance.getTransactionHash(
        targetAddr, // to
        ethValue, // eth value
        calldata, // action calldata
        callType, // 1 is delegate call
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        hre.ethers.constants.AddressZero, // gasToken
        hre.ethers.constants.AddressZero, // refundReceiver
        nonce // nonce
    );

    console.log(`Tx hash of safe ${txHash}`);

    const owners = await safeInstance.getOwners();
    const ownerAsSigner = await hre.ethers.provider.getSigner(owners[0]);

    // encode r and s
    let sig = abiCoder.encode(["address", "bytes32"], [owners[0], "0x0000000000000000000000000000000000000000000000000000000000000000"]);

    // add v = 1
    sig += "01";

    // call safe function
    const receipt = await safeInstance.connect(ownerAsSigner).execTransaction(
        targetAddr,
        ethValue,
        calldata,
        callType,
        0,
        0,
        0,
        hre.ethers.constants.AddressZero,
        hre.ethers.constants.AddressZero,
        sig,
        { gasLimit: 8000000 }
    );

    return receipt;
}

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
 * Get an existing or build a new Safe/DsProxy ethers.Contract object for an EOA
 * @param {string} account proxy owner
 * @param {string} proxyAddr address of the proxy that will be used for the position, if not provided a new proxy will be created
 * @param {boolean} isSafe whether to create a safe or dsproxy if proxyAddr is not provided. Defaults to safe
 * @returns {Object} Safe/DSProxy ethers.Contract object
 */
async function getProxy(account, proxyAddr = hre.ethers.constants.AddressZero, isSafe = true) {
    const accSigner = await hre.ethers.getSigner(account);
    const { chainId } = await hre.ethers.provider.getNetwork();
    const [signer] = await hre.ethers.getSigners();

    if (proxyAddr !== hre.ethers.constants.AddressZero) {
        let proxy = new hre.ethers.Contract(proxyAddr, safeAbi, accSigner);

        try {
            await proxy.nonce();
        } catch (error) {
            proxy = new hre.ethers.Contract(proxyAddr, proxyAbi, accSigner);
        }
        return proxy;
    }

    if (isSafe) {
        const safeAddr = await createSafe(account);
        const safe = new hre.ethers.Contract(safeAddr, safeAbi, accSigner);

        console.log(`Safe created ${safeAddr}`);
        return safe;
    }

    let dsProxyRegistryContract = new hre.ethers.Contract(addresses[chainId].PROXY_REGISTRY, proxyRegistryAbi, signer);
    let dsProxyAddr = await dsProxyRegistryContract.proxies(account);

    if (dsProxyAddr === hre.ethers.constants.AddressZero) {
        dsProxyRegistryContract = await dsProxyRegistryContract.connect(accSigner);
        await dsProxyRegistryContract.build(account);
        dsProxyAddr = await dsProxyRegistryContract.proxies(account);
    }
    const dsProxy = new hre.ethers.Contract(dsProxyAddr, proxyAbi, accSigner);

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
 * @param {string} owner the EOA which will be sending transactions and own the newly created proxy if proxyAddr is not provided
 * @param {string} proxyAddr the address of the proxy that will be used for the position, if not provided a new proxy will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has sender account and his proxy
 */
async function getSender(owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const senderAcc = await hre.ethers.provider.getSigner(owner.toString());

    senderAcc.address = senderAcc._address;

    // create Proxy if the sender doesn't already have one
    const proxy = await getProxy(senderAcc.address, proxyAddr, useSafe);

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

        await tokenContractSigner.approve(to, hre.ethers.constants.MaxUint256, { gasLimit: 30000000 });
    }
}

/**
 * Execute an action through a proxy
 * @param {Object} proxy user's wallet
 * @param {string} targetAddr address of the contract we're invoking via proxy
 * @param {Object} callData encoded function call
 * @param {number} ethValue eth value to send. Defaults to 0
 * @returns {void}
 */
async function executeActionFromProxy(proxy, targetAddr, callData, ethValue = 0) {
    let receipt;

    if (isProxySafe(proxy)) {
        receipt = await executeSafeTx(
            proxy,
            targetAddr,
            callData,
            1,
            ethValue
        );
    } else {
        receipt = await proxy["execute(address,bytes)"](targetAddr, callData, {
            gasLimit: 30000000,
            value: ethValue
        });
    }
    const txData = await hre.ethers.provider.getTransactionReceipt(receipt.hash);

    if (txData.status !== 1) {
        throw new Error(`Action execution failed on address: ${targetAddr}`);
    }
}

/**
 * Util function for invoking an action via DSProxy
 * @param {string} actionName name of the Contract we're invoking via proxy
 * @param {string} functionData dfs sdk action encoded for proxy
 * @param {Object} proxy DSProxy ethers.Contract object
 * @returns {Object} receipt of the transaction
 */
async function executeAction(actionName, functionData, proxy) {
    const actionAddr = await getAddrFromRegistry(actionName);

    await executeActionFromProxy(proxy, actionAddr, functionData);
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
    await Promise.all(accounts.map(async account => {
        await topUpAccount(account, 100);
    }));
}

/**
 * Lowers safe threshold to 1
 * @param {string} forkId ID of the tenderly fork
 * @param {Array<string>} safes  all the accounts that will be sending transactions}
 * @param {Array<number>} thresholds new threshold value that will be set for matching safe
 * @returns {void}
 */
async function lowerSafesThreshold(forkId, safes, thresholds) {
    const provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    const thresholdSlot = toBytes32(hre.ethers.utils.parseUnits("4", 0)).toString();

    for (let i = 0; i < safes.length; i++) {
        const thresholdValue = toBytes32(hre.ethers.utils.parseUnits(thresholds[i].toString(), 0)).toString();

        await provider.send("tenderly_setStorageAt", [safes[i], thresholdSlot, thresholdValue]);
    }
}

/**
 * Find balance slot info for a token
 * @param {string} tokenAddress address of the token
 * @returns {Object} slot info
 */
async function findBalancesSlot(tokenAddress) {
    const slotObj = storageSlots[tokenAddress];

    if (slotObj) {
        return { isVyper: slotObj.isVyper, num: slotObj.num };
    }

    // eslint-disable-next-line func-style
    const encode = (types, values) => hre.ethers.utils.defaultAbiCoder.encode(types, values);
    const account = hre.ethers.constants.AddressZero;
    const probeA = encode(["uint"], [1]);
    const probeB = encode(["uint"], [2]);

    const [signer] = await hre.ethers.getSigners();
    const token = new hre.ethers.Contract(tokenAddress, erc20Abi, signer);

    for (let i = 0; i < 10; i++) {
        {
            const probedSlot = hre.ethers.utils.keccak256(
                encode(["address", "uint"], [account, i])
            );

            const prev = await hre.ethers.provider.send(
                "eth_getStorageAt",
                [tokenAddress, probedSlot, "latest"]
            );

            // make sure the probe will change the slot value
            const probe = prev === probeA ? probeB : probeA;

            await hre.ethers.provider.send("tenderly_setStorageAt", [
                tokenAddress,
                probedSlot,
                probe
            ]);

            const balance = await token.balanceOf(account);

            // reset to previous value
            await hre.ethers.provider.send("tenderly_setStorageAt", [
                tokenAddress,
                probedSlot,
                prev
            ]);
            if (balance.eq(hre.ethers.BigNumber.from(probe))) {
                const result = { isVyper: false, num: i };

                return result;
            }
        }
        {
            let probedSlot = hre.ethers.utils.keccak256(
                encode(["uint", "address"], [i, account])
            );


            // remove padding for JSON RPC
            while (probedSlot.startsWith("0x0")) {
                probedSlot = `0x${probedSlot.slice(3)}`;
            }
            const prev = await hre.ethers.provider.send(
                "eth_getStorageAt",
                [tokenAddress, probedSlot, "latest"]
            );

            // make sure the probe will change the slot value
            const probe = prev === probeA ? probeB : probeA;

            await hre.ethers.provider.send("tenderly_setStorageAt", [
                tokenAddress,
                probedSlot,
                probe
            ]);

            const balance = await token.balanceOf(account);


            // reset to previous value
            await hre.ethers.provider.send("tenderly_setStorageAt", [
                tokenAddress,
                probedSlot,
                prev
            ]);
            if (balance.eq(hre.ethers.BigNumber.from(probe))) {
                const result = { isVyper: true, num: i };

                return result;
            }
        }
    }
    throw new Error("Failed to find balance storage slot");
}

/**
 * Grants a desired token balance to an address
 * @param {string} tokenAddr address of the ERC20 token
 * @param {string} userAddr address which we want to receive the desired amount of tokens
 * @param {number} amount new balance to set in decimal numbers (not wei)
 * @returns {void}
 */
async function setBalance(tokenAddr, userAddr, amount) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    const [signer] = await hre.ethers.getSigners();

    const erc20 = new hre.ethers.Contract(tokenAddr, erc20Abi, signer);

    const decimals = await erc20.decimals();
    const value = hre.ethers.utils.parseUnits(amount.toString(), decimals);

    try {

        let tokenContract = new hre.ethers.Contract(tokenAddr, iProxyERC20Abi, signer);
        const newTokenAddr = await tokenContract.callStatic.target();

        tokenContract = new hre.ethers.Contract(newTokenAddr, iProxyERC20Abi, signer);
        const tokenState = await tokenContract.callStatic.tokenState();

        // eslint-disable-next-line no-param-reassign
        tokenAddr = tokenState;
        // eslint-disable-next-line no-empty, no-unused-vars
    } catch (error) {

        // bojsa pls
    }
    let slotObj = storageSlots[chainId][tokenAddr.toString().toLowerCase()];

    if (!slotObj) {
        slotObj = await findBalancesSlot(tokenAddr.toString());
    }
    const slotInfo = { isVyper: slotObj.isVyper, num: slotObj.num };
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

    /**
     * @description
     * Use this to find slot for a token
     */
    // const prevBalance = await erc20.balanceOf(userAddr);
    // for (let i = 0; i < 20; i++) {
    //     const slotInfo = { isVyper: slotObj.isVyper, num: i };
    //     let index;
    //
    //     if (slotInfo.isVyper) {
    //         index = hre.ethers.utils.solidityKeccak256(
    //             ["uint256", "uint256"],
    //             [slotInfo.num, userAddr] // key, slot
    //         );
    //     } else {
    //         index = hre.ethers.utils.solidityKeccak256(
    //             ["uint256", "uint256"],
    //             [userAddr, slotInfo.num] // key, slot
    //         );
    //     }
    //     await hre.ethers.provider.send("tenderly_setStorageAt", [tokenAddr, index.toString(), toBytes32(value).toString()]);
    //     await hre.ethers.provider.send("evm_mine", []); // Just mines to the next block
    //     if ((await erc20.balanceOf(userAddr)).toString() !== prevBalance.toString()) {
    //         console.log(i);
    //         break;
    //     }
    // }
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

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

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
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].SPARK_SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, sparkSubProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToSparkAutomation",
        [strategySub]
    );

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

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

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

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
        [strategySub, false]
    );

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribe to a strategy using LiquityLeverageManagementSubProxy
 * @param {string} proxy owner's proxy address
 * @param {string} strategySub strategySub properly encoded
 * @returns {number} ID of the subscription
 */
async function subToLiquityLeverageManagementAutomation(proxy, strategySub) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const subProxyAddr = addresses[chainId].LIQUITY_LEVERAGE_MANAGEMENT_SUB_PROXY;

    const [signer] = await hre.ethers.getSigners();
    const subProxy = new hre.ethers.Contract(subProxyAddr, liquityLeverageManagementSubProxyAbi, signer);

    const functionData = subProxy.interface.encodeFunctionData(
        "subToLiquityAutomation",
        [strategySub]
    );

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Whether to default to Safe or use DSProxy
 * @param {Object} req request object
 * @returns {boolean} true if we should default to Safe
 */
function defaultsToSafe(req) {
    const useDsProxy = req.body.walletType && req.body.walletType === "dsproxy";

    return !useDsProxy;
}

/**
 * Read walletAddr from request. If not provided, return AddressZero, meaning new wallet will be created
 * @param {Object} req request object
 * @returns {string} wallet address
 */
function getWalletAddr(req) {
    return req.body.walletAddr ? req.body.walletAddr : hre.ethers.constants.AddressZero;
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
    subToLiquityLeverageManagementAutomation,
    isContract,
    lowerSafesThreshold,
    defaultsToSafe,
    executeActionFromProxy,
    getWalletAddr,
    createSafe
};
