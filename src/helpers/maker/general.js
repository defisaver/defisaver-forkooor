const {
    getAssetInfo, ilks, utils: { compare },
} = require('@defisaver/tokens');
const dfs = require('@defisaver/sdk');
const hre = require('hardhat');
const { getCDPsabi } = require('../../abi/maker/views');
const { getAddrFromRegistry, getProxy, approve } = require('../../utils');
const { setBalance, topUpAccount } = require('../utils/general');


const GET_CDPS_ADDR = '0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573';
const MCD_MANAGER_ADDR = '0x5ef30b9986345249bc32d8928B7ee64DE9435E39';


const createMcdVault = async (forkId, type, coll, debt, sender) => {
    await topUpAccount(forkId, sender, 100);
    hre.ethers.provider = await hre.ethers.getDefaultProvider(`https://rpc.tenderly.co/fork/${forkId}`);
    let senderAcc = (await hre.ethers.getSigners())[0];
    if (sender) {
        senderAcc = await hre.ethers.provider.getSigner(sender.toString());
        // eslint-disable-next-line no-underscore-dangle
        senderAcc.address = senderAcc._address;
    }
    let proxy = await getProxy(senderAcc.address);

    const ilkObj = ilks.find((i) => i.ilkLabel === type);

    let asset = ilkObj.asset;

    if (asset === 'ETH') asset = 'WETH';

    const tokenData = getAssetInfo(asset);

    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), tokenData.decimals);
    const amountDai = hre.ethers.utils.parseUnits(debt.toString(), 18);

    await setBalance(forkId, tokenData.address, sender, coll);
    await approve(tokenData.address, proxy.address, sender);
    console.log("HERE");
    const recipeExecutorAddr = await getAddrFromRegistry('RecipeExecutor');
    console.log("HERE");
    const createVaultRecipe = new dfs.Recipe('CreateVaultRecipe', [
        new dfs.actions.maker.MakerOpenVaultAction(ilkObj.join, MCD_MANAGER_ADDR),
        new dfs.actions.maker.MakerSupplyAction('$1', amountColl, ilkObj.join, senderAcc.address, MCD_MANAGER_ADDR),
        new dfs.actions.maker.MakerGenerateAction('$1', amountDai, senderAcc.address, MCD_MANAGER_ADDR),
    ]);
    console.log("RECIPE");

    const functionData = createVaultRecipe.encodeForDsProxyCall();

    try {
        await proxy['execute(address,bytes)'](recipeExecutorAddr, functionData[1], { gasLimit: 3000000 });

        const vaultsAfter = await getVaultsForUser(proxy.address);
        console.log(vaultsAfter);

        console.log(`Vault #${vaultsAfter.ids[vaultsAfter.ids.length - 1].toString()} created`);
    } catch (err) {
        console.log(err);
    }

    process.exit(0);
};

const getVaultsForUser = async (user) => {
    const [signer] = await hre.ethers.getSigners();
    
    const getCDPsContract = new hre.ethers.Contract(GET_CDPS_ADDR, getCDPsabi, signer);

    const vaults = await getCDPsContract.getCdpsAsc(MCD_MANAGER_ADDR, user);

    return vaults;
 }

 module.exports = {
    createMcdVault
 }