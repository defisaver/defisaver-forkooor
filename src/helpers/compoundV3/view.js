const hre = require("hardhat");
const { compoundV3ViewAbi } = require("../../abi/compoundV3/abis");

const compoundV3View = {
    address: "0xf522b1588688b9887623b9C666175684d284D363",
    abi: compoundV3ViewAbi
};

/**
 * returns Compound V3 position data
 * @param {string} market compoundV3 market address
 * @param {string} user user address of compound position
 * @returns {Object} object with user position data
 */
async function getLoanData(market, user) {
    const [signer] = await hre.ethers.getSigners();

    const view = new hre.ethers.Contract(compoundV3View.address, compoundV3View.abi, signer);

    const loanData = await view.getLoanData(market, user);

    return {
        user: loanData.user,
        collAddr: loanData.collAddr,
        collAmounts: loanData.collAmounts.map(amount => amount.toString()),
        depositAmount: loanData.depositAmount.toString(),
        depositValue: loanData.depositValue.toString(),
        borrowAmount: loanData.borrowAmount.toString(),
        borrowValue: loanData.borrowValue.toString(),
        collValue: loanData.collValue.toString()
    };
}

module.exports = {
    getLoanData
};
