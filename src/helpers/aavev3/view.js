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

async function getFullTokensInfo(market, assets) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, signer);

    return await view.getFullTokensInfo(market, assets);
}
async function getLoanData(market, user) {
    const [signer] = await hre.ethers.getSigners();
    const view = new hre.ethers.Contract(aaveView.address, aaveView.abi, signer);

    const loanData = await view.getLoanData(market, user);

    return {
        user: loanData.user,
        ratio: loanData.ratio.toString(),
        eMode: loanData.eMode.toString(),
        collAddr: loanData.collAddr,
        borrowAddr: loanData.borrowAddr,
        collAmounts: loanData.collAmounts.map(amount => amount.toString()),
        borrowStableAmounts: loanData.borrowStableAmounts.map(amount =>
            amount.toString()),
        borrowVariableAmounts: loanData.borrowVariableAmounts.map(amount =>
            amount.toString()),
        ltv: loanData.ltv,
        liquidationThreshold: loanData.liquidationThreshold,
        liquidationBonus: loanData.liquidationBonus,
        priceSource: loanData.priceSource,
        label: loanData.label
    };
}

module.exports = {
    getFullTokensInfo,
    getLoanData
};
