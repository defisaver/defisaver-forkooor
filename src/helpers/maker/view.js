const { ilks } = require("@defisaver/tokens");
const hre = require("hardhat");

const { mcdViewAbi, getCDPsabi } = require("../../abi/maker/views");

const GET_CDPS_ADDR = "0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573";
const MCD_VIEW_ADDR = "0x922C795aE0be55Aaeb3FF51813B76AFc78e97C7c";


/**
 * Function that fetches MCD_MANAGER_ADDRESS from McdView contract
 * @returns {string} MCD_MANAGER_ADDRESS
 */
async function getMcdManagerAddr() {
    const [signer] = await hre.ethers.getSigners();
    const mcdView = new hre.ethers.Contract(MCD_VIEW_ADDR, mcdViewAbi, signer);
    const mcdManagerAddr = await mcdView.MCD_MANAGER();

    return mcdManagerAddr;
}

/**
 *  fetch vault IDs and ilks for each of the users MCD vaults
 * @param {string} user EOA address
 * @param {string} mcdManager MCD_MANAGER_ADDRESS
 * @returns {Array<Object>} array of users Vaults with their IDs, urns and ilks
 */
async function getVaultsForUser(user, mcdManager) {
    let mcdManagerAddr;

    if (!mcdManager) {
        mcdManagerAddr = await getMcdManagerAddr();
    } else {
        mcdManagerAddr = mcdManager;
    }
    const [signer] = await hre.ethers.getSigners();
    const getCDPsContract = new hre.ethers.Contract(GET_CDPS_ADDR, getCDPsabi, signer);
    const vaults = await getCDPsContract.getCdpsAsc(mcdManagerAddr, user);

    return vaults;
}


/**
 * Fetch coll, debt and ilk type for the given vaultId
 * @param {integer} vaultId MCD Vault ID
 * @param {string} mcdManager MCD_MANAGER_ADDRESS (optional)
 * @returns {Object} object that has vaultId, ilkLabel and latest coll and debt amounts in wei
 */
async function getVaultInfo(vaultId, mcdManager = null) {
    let mcdManagerAddress;

    if (!mcdManager) {
        mcdManagerAddress = await getMcdManagerAddr();
    } else {
        mcdManagerAddress = mcdManager;
    }
    const [signer] = await hre.ethers.getSigners();
    const mcdView = new hre.ethers.Contract(MCD_VIEW_ADDR, mcdViewAbi, signer);
    const urnAndIlk = await mcdView.getUrnAndIlk(mcdManagerAddress, vaultId);
    const info = await mcdView.getVaultInfo(mcdManagerAddress, vaultId, urnAndIlk[1]);

    const ilk = ilks.find(i => i.ilkBytes === urnAndIlk[1]);
    const ilkLabel = ilk.ilkLabel;

    return {
        vaultId,
        ilkLabel,
        coll: info[0].toString(),
        debt: info[1].toString()
    };
}

/**
 * Fetch Maker Dsr balance for specific user
 * @dev temporary solution until McdView is redeployed
 * @param {string} owner address for which to check dsr balance
 * @returns {number} amount of dai in dsr
 */
async function getDsrBalance(owner) {
    const POT_ADDRESS = "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7";
    const dripSelector = hre.ethers.utils.id("drip()").slice(0, 10);
    const pieSelector = hre.ethers.utils.id("pie(address)").slice(0, 10);

    const ownerEncoded = hre.ethers.utils.defaultAbiCoder.encode(["address"], [owner]);

    const [drip] = await hre.ethers.provider.call({ to: POT_ADDRESS, data: dripSelector })
        .then(e => hre.ethers.utils.defaultAbiCoder.decode(["uint256"], e));
    const [pie] = await hre.ethers.provider.call({ to: POT_ADDRESS, data: pieSelector.concat(ownerEncoded.slice(2)) })
        .then(e => hre.ethers.utils.defaultAbiCoder.decode(["uint256"], e));
    const ray = hre.ethers.BigNumber.from("0x33b2e3c9fd0803ce8000000"); // 1e27 BN

    return hre.ethers.utils.formatUnits(pie.mul(drip).div(ray));
}

module.exports = {
    getVaultsForUser,
    getVaultInfo,
    getMcdManagerAddr,
    getDsrBalance
};
