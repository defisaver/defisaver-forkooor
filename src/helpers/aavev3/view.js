const hre = require("hardhat");
const { aaveV3ViewAbi, aaveV3SubProxyAbi } = require("../../abi/aaveV3/abis");


const aaveView = {
    address: "0x8095fFFC3cDdE58C4F537D39f9795A40a103e633",
    abi: aaveV3ViewAbi
};

const aaveSubProxy = {
    address: "0xb9F73625AA64D46A9b2f0331712e9bEE19e4C3f7",
    abi: aaveV3SubProxyAbi
};

async function getFullTokensInfo(provider, market, assets) {
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, provider);

    return await view.getFullTokensInfo(market, assets);
}
async function getLoanData(provider, market, user) {
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, provider);

    return await view.getLoanData(market, user);
}

module.exports = {
    getFullTokensInfo,
    getLoanData
};
