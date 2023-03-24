const { ilks } = require('@defisaver/tokens');
const hre = require('hardhat');

const { mcdViewAbi, getCDPsabi } = require('../../abi/maker/views')

const GET_CDPS_ADDR = '0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573';
const MCD_VIEW_ADDR = '0x922C795aE0be55Aaeb3FF51813B76AFc78e97C7c';
const DAI_ADDR = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// fetch vault IDs and ilks for each users MCD vault
const getVaultsForUser = async (user, mcdManager) => {
    if (!mcdManager){
        mcdManager = await getMcdManagerAddr();
    };
    const [signer] = await hre.ethers.getSigners();
    const getCDPsContract = new hre.ethers.Contract(GET_CDPS_ADDR, getCDPsabi, signer);
    const vaults = await getCDPsContract.getCdpsAsc(mcdManager, user);

    return vaults;
 };

 // get coll, debt and ilk type for the given vaultId
 const getVaultInfo = async (vaultId, mcdManager) => {
    if (!mcdManager){
        mcdManager = await getMcdManagerAddr();
    };
    const [signer] = await hre.ethers.getSigners();
    const mcdView = new hre.ethers.Contract(MCD_VIEW_ADDR, mcdViewAbi, signer);
    const urnAndIlk = await mcdView.getUrnAndIlk(mcdManager, vaultId);
    const info = await mcdView.getVaultInfo(mcdManager, vaultId, urnAndIlk[1]);

    const ilk = ilks.find((i) => i.ilkBytes === urnAndIlk[1]);
    ilkLabel = ilk.ilkLabel;

    return {
        vaultId,
        ilkLabel,
        coll: info[0].toString(),
        debt: info[1].toString(),
    };
};

const getMcdManagerAddr = async () => {
    const [signer] = await hre.ethers.getSigners();
    const mcdView = new hre.ethers.Contract(MCD_VIEW_ADDR, mcdViewAbi, signer);
    const mcdManagerAddr = await mcdView.MCD_MANAGER();
    return mcdManagerAddr;
}

module.exports = {
    getVaultsForUser,
    getVaultInfo,
    getMcdManagerAddr,
    DAI_ADDR,
}