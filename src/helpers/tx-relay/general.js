/* eslint-disable jsdoc/require-jsdoc */
const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfo } = require("@defisaver/tokens");
const { approve, setBalance, addresses, getTestSignerUsingPrivateKey } = require("../../utils");
const { getFullTokensInfo } = require("../aavev3/view");
const { safeAbi, safeFactoryAbi, txRelayExecutorAbi } = require("../../abi/general");
const { ecsign } = require("@ethereumjs/util");


async function getOrCreateSafe(signer, shouldCreateNewSafe, existingSafeAddress) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    if (shouldCreateNewSafe) {
        const safeFactory = new hre.ethers.Contract(addresses[chainId].SAFE_FACTORY, safeFactoryAbi, signer);
        const safeSingleton = new hre.ethers.Contract(addresses[chainId].SAFE_SINGLETON, safeAbi, signer);

        const setupData = [
            [signer.address], // owner
            1, // threshold
            hre.ethers.constants.AddressZero, // to module address
            [], // data for module
            hre.ethers.constants.AddressZero, // fallback handler
            hre.ethers.constants.AddressZero, // payment token
            0, // payment
            hre.ethers.constants.AddressZero // payment receiver
        ];

        const functionData = safeSingleton.interface.encodeFunctionData("setup", setupData);
        const proxyCreationCode = await safeFactory.proxyCreationCode();
        const saltNonce = Date.now();
        const salt = hre.ethers.utils.keccak256(
            hre.ethers.utils.solidityPack(
                [
                    "bytes",
                    "uint256"
                ],
                [
                    hre.ethers.utils.keccak256(functionData),
                    saltNonce
                ]
            )
        );
        const predicatedSafeAddress = hre.ethers.utils.getCreate2Address(
            addresses[chainId].SAFE_FACTORY,
            salt,
            hre.ethers.utils.keccak256(
                proxyCreationCode.concat(addresses[chainId].SAFE_SINGLETON.slice(2).padStart(64, "0"))
            )
        );

        console.log("predicatedSafeAddress", predicatedSafeAddress);

        await safeFactory.createProxyWithNonce(
            addresses[chainId].SAFE_SINGLETON,
            functionData,
            saltNonce
        );

        const safe = new hre.ethers.Contract(predicatedSafeAddress, safeAbi, signer);

        return safe;
    }

    return new hre.ethers.Contract(existingSafeAddress, safeAbi, signer);
}

function signSafeTx(testAccountNumber, messageHash) {
    const sk = process.env[`TEST_MAINNET_PRIVATE_KEY_${testAccountNumber}`];

    const signature = ecsign(messageHash, sk);

    const rHex = `0x${Array.from(signature.r).map(byte => byte.toString(16).padStart(2, "0")).join("")}`;
    const sHex = Array.from(signature.s).map(byte => byte.toString(16).padStart(2, "0")).join("");
    const vHex = signature.v.toString(16).padStart(2, "0");

    const signatureHex = rHex + sHex + vHex;

    console.log(signatureHex);

    return signatureHex;
}

/**
 * Determine additional gas used needed for calculating and sending fee
 * Adjust values based on fee token
 * This values will be singed from UI as they are packed into safe signature
 * @param {*} feeToken token address for taking fee
 * @returns { number } additional gas used for calculating and sending fee
 */
async function determineAdditionalGasUsed(feeToken) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    const supportedTokens = {
        [addresses[chainId].USDC_ADDR.toLowerCase()]: 64300,
        [addresses[chainId].DAI_ADDR.toLowerCase()]: 53623,
        [addresses[chainId].WETH_ADDR.toLowerCase()]: 10000
    };

    if (feeToken.toLowerCase() in supportedTokens) {
        return supportedTokens[feeToken.toLowerCase()];
    }
    throw new Error("Unsupported fee token");
}

async function createAaveV3PositionRecipe(
    aaveData,
    senderAcc,
    safe
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const marketAddress = addresses[chainId].AAVE_V3_MARKET;
    const collTokenData = getAssetInfo(aaveData.collToken === "ETH" ? "WETH" : aaveData.collToken, chainId);
    const debtTokenData = getAssetInfo(aaveData.debtToken === "ETH" ? "WETH" : aaveData.debtToken, chainId);

    // set coll balance for the user
    await setBalance(collTokenData.address, senderAcc.address, aaveData.collAmount);

    // approve coll asset for safe to pull
    await approve(collTokenData.address, safe.address, senderAcc.address);

    const amountColl = hre.ethers.utils.parseUnits(aaveData.collAmount.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(aaveData.debtAmount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
    const aaveCollInfo = infos[0];
    const aaveDebtInfo = infos[1];

    const supplyAction = new dfs.actions.aaveV3.AaveV3SupplyAction(
        false,
        marketAddress,
        amountColl.toString(),
        senderAcc.address,
        collTokenData.address,
        aaveCollInfo.assetId,
        true,
        false,
        safe.address
    );

    const borrowAction = new dfs.actions.aaveV3.AaveV3BorrowAction(
        false,
        marketAddress,
        amountDebt.toString(),
        senderAcc.address,
        aaveData.rateMode.toString(),
        aaveDebtInfo.assetId,
        false,
        safe.address
    );

    return new dfs.Recipe("CreateAaveV3PositionRecipe", [
        supplyAction,
        borrowAction
    ]);
}

async function signCreationOfAaveV3Position(
    testAccountNumber,
    shouldCreateNewSafe,
    existingSafeAddress,
    txRelayParams,
    aaveData
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const senderAcc = await getTestSignerUsingPrivateKey(testAccountNumber);
    const safe = await getOrCreateSafe(senderAcc, shouldCreateNewSafe, existingSafeAddress);

    console.log("sender acc", senderAcc.address);
    console.log("safe", safe.address);

    const createPositionRecipe = await createAaveV3PositionRecipe(aaveData, senderAcc, safe);

    const feeTokenData = getAssetInfo(txRelayParams.feeToken === "ETH" ? "WETH" : txRelayParams.feeToken, chainId);

    const userSignedDataForTxRelay = {
        additionalGasUsed: await determineAdditionalGasUsed(feeTokenData.address, true),
        maxGasPrice: txRelayParams.maxGasPrice * 1e9,
        maxTxCostInFeeToken: hre.ethers.utils.parseUnits(
            txRelayParams.maxTxCostInFeeToken.toString(),
            feeTokenData.decimals
        ),
        feeToken: feeTokenData.address
    };

    // set max tx cost in fee token for the user
    await setBalance(feeTokenData.address, senderAcc.address, userSignedDataForTxRelay.maxTxCostInFeeToken);

    // approve fee token for safe to pull
    await approve(feeTokenData.address, safe.address, senderAcc.address);

    console.log("userSignedDataForTxRelay", userSignedDataForTxRelay);
    const encodedData = createPositionRecipe.encodeForTxRelayCall(userSignedDataForTxRelay)[1];
    const safeTxParamsForSign = {
        to: addresses[chainId].RECIPE_EXECUTOR_TX_RELAY,
        value: 0,
        data: encodedData,
        operation: 1,
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: hre.ethers.constants.AddressZero,
        refundReceiver: hre.ethers.constants.AddressZero,
        nonce: await safe.nonce()
    };
    const messageHash = await safe.getTransactionHash(
        safeTxParamsForSign.to,
        safeTxParamsForSign.value,
        safeTxParamsForSign.data,
        safeTxParamsForSign.operation,
        safeTxParamsForSign.safeTxGas,
        safeTxParamsForSign.baseGas,
        safeTxParamsForSign.gasPrice,
        safeTxParamsForSign.gasToken,
        safeTxParamsForSign.refundReceiver,
        safeTxParamsForSign.nonce
    );

    console.log("message hash: ", messageHash);

    const messageHashAsHex = messageHash.toString().slice(2);
    const signature = signSafeTx(testAccountNumber, messageHashAsHex);

    return {
        safeTxParams: {
            value: 0,
            safe: safe.address,
            data: safeTxParamsForSign.data,
            signatures: signature
        },
        signedMessageHash: messageHash,
        eoa: senderAcc.address
    };
}

async function executeTxRelaySignedTx(
    _value,
    _safe,
    _data,
    _signatures,
    _botAddress
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const botSigner = await hre.ethers.getSigner(_botAddress);
    const txRelay = new hre.ethers.Contract(addresses[chainId].TX_RELAY_EXECUTOR, txRelayExecutorAbi, botSigner);

    const safeTxParams = {
        value: _value,
        safe: _safe,
        data: hre.ethers.utils.arrayify(_data),
        signatures: hre.ethers.utils.arrayify(_signatures)
    };

    const txReceipt = await txRelay.executeTxUsingFeeTokens(safeTxParams, {
        gasLimit: 8000000
    });

    const result = await hre.ethers.provider.getTransactionReceipt(txReceipt.hash);

    return result;
}

module.exports = {
    signCreationOfAaveV3Position,
    executeTxRelaySignedTx
};
