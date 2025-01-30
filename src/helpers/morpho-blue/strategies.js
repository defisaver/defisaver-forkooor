const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { subToStrategy, getSender } = require("../../utils");
const { configure } = require("@defisaver/sdk");
const abiCoder = new hre.ethers.utils.AbiCoder();


/**
 * Subscribes to MorphoBlue Repay Bundle
 * @param {Object} owner wallet owner
 * @param {number} bundleId MorphoBlue repay Bundle Id
 * @param {Object} marketParams market params in []
 * @param {string} marketId id of the MorphoBlue market
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} user address of the user who is owner of morphoblue position
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueRepayBundle(
    owner, bundleId, marketParams, marketId, minRatio, targetRatio, user, proxyAddr, useSafe = true
) {
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

    const { chainId } = await hre.ethers.provider.getNetwork();

    configure({
        chainId,
        testMode: false
    });

    if (user === hre.ethers.constants.AddressZero) {
        // eslint-disable-next-line no-param-reassign
        user = proxy.address;
    }

    const triggerData = abiCoder.encode(["bytes32", "address", "uint256", "uint8"], [marketId, user, hre.ethers.utils.parseUnits(minRatio.toString(), 16).toString(), 1]);
    const loanTokenEncoded = abiCoder.encode(["address"], [marketParams[0]]);
    const collateralTokenEncoded = abiCoder.encode(["address"], [marketParams[1]]);
    const oracleEncoded = abiCoder.encode(["address"], [marketParams[2]]);
    const irmEncoded = abiCoder.encode(["address"], [marketParams[3]]);
    const lltvEncoded = abiCoder.encode(["uint256"], [marketParams[4]]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [1]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);

    const userEncoded = abiCoder.encode(["address"], [user]);
    const strategySub = [bundleId, true, [triggerData],
        [
            loanTokenEncoded,
            collateralTokenEncoded,
            oracleEncoded,
            irmEncoded,
            lltvEncoded,
            ratioStateEncoded,
            targetRatioEncoded,
            userEncoded
        ]
    ];
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MorphoBlue Repay Bundle
 * @param {Object} owner wallet owner
 * @param {number} bundleId MorphoBlue repay Bundle Id
 * @param {Object} marketParams market params in []
 * @param {string} marketId id of the MorphoBlue market
 * @param {number} maxRatio ratio above which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} user address of the user who is owner of morphoblue position
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueBoostBundle(
    owner, bundleId, marketParams, marketId, maxRatio, targetRatio, user, proxyAddr, useSafe = true
) {
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

    const { chainId } = await hre.ethers.provider.getNetwork();

    configure({
        chainId,
        testMode: false
    });

    if (user === hre.ethers.constants.AddressZero) {
        // eslint-disable-next-line no-param-reassign
        user = proxy.address;
    }

    const triggerData = abiCoder.encode(["bytes32", "address", "uint256", "uint8"], [marketId, user, hre.ethers.utils.parseUnits(maxRatio.toString(), 16).toString(), 0]);
    const loanTokenEncoded = abiCoder.encode(["address"], [marketParams[0]]);
    const collateralTokenEncoded = abiCoder.encode(["address"], [marketParams[1]]);
    const oracleEncoded = abiCoder.encode(["address"], [marketParams[2]]);
    const irmEncoded = abiCoder.encode(["address"], [marketParams[3]]);
    const lltvEncoded = abiCoder.encode(["uint256"], [marketParams[4]]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [0]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);

    const userEncoded = abiCoder.encode(["address"], [user]);
    const strategySub = [bundleId, true, [triggerData],
        [
            loanTokenEncoded,
            collateralTokenEncoded,
            oracleEncoded,
            irmEncoded,
            lltvEncoded,
            ratioStateEncoded,
            targetRatioEncoded,
            userEncoded
        ]
    ];
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MorphoBlue Boost On Price Bundle
 * @param {Object} walletOwner wallet owner
 * @param {number} bundleId MorphoBlue boost on price bundle Id
 * @param {Object} marketParams market params in []
 * @param {number} targetRatio target ratio for boost on price
 * @param {string} user address of the user who is owner of morphoblue position (EOA or Wallet address)
 * @param {number} price price to trigger the strategy
 * @param {string} priceState under or over
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueBoostOnPriceBundle(
    walletOwner, bundleId, marketParams, targetRatio, user, price, priceState, proxyAddr, useSafe = true
) {
    const [, proxy] = await getSender(walletOwner, proxyAddr, useSafe);

    const { chainId } = await hre.ethers.provider.getNetwork();

    configure({
        chainId,
        testMode: false
    });

    if (user === hre.ethers.constants.AddressZero) {
        // eslint-disable-next-line no-param-reassign
        user = proxy.address;
    }
    const strategySub = automationSdk.strategySubService.morphoBlueEncode.leverageManagementOnPrice(
        bundleId,
        true,
        marketParams[0],
        marketParams[1],
        marketParams[2],
        marketParams[3],
        marketParams[4],
        user,
        targetRatio,
        price,
        priceState.toLowerCase() === "under"
            ? automationSdk.enums.RatioState.UNDER
            : automationSdk.enums.RatioState.OVER
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subMorphoBlueRepayBundle,
    subMorphoBlueBoostBundle,
    subMorphoBlueBoostOnPriceBundle,
};
