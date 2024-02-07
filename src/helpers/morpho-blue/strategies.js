const hre = require("hardhat");
const { subToStrategy, getSender } = require("../../utils");
const abiCoder = new hre.ethers.utils.AbiCoder();


/**
 * Subscribes to MorphoBlue Repay Bundle
 * @param {Object} owner eoa or proxy
 * @param {number} bundleId MorphoBlue repay Bundle Id
 * @param {Object} marketParams market params in []
 * @param {string} marketId id of the MorphoBlue market
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} user address of the user who is owner of morphoblue position
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueRepayBundle(
    owner, bundleId, marketParams, marketId, minRatio, targetRatio, user
) {
    const [, proxy] = await getSender(owner);

    if (user === "0x0000000000000000000000000000000000000000") {
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
 * @param {Object} owner eoa or proxy
 * @param {number} bundleId MorphoBlue repay Bundle Id
 * @param {Object} marketParams market params in []
 * @param {string} marketId id of the MorphoBlue market
 * @param {number} maxRatio ratio above which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} user address of the user who is owner of morphoblue position
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueBoostBundle(
    owner, bundleId, marketParams, marketId, maxRatio, targetRatio, user
) {
    const [, proxy] = await getSender(owner);

    if (user === "0x0000000000000000000000000000000000000000") {
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

module.exports = {
    subMorphoBlueRepayBundle,
    subMorphoBlueBoostBundle
};
