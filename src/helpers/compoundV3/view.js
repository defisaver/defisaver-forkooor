const hre = require("hardhat");
const { compoundV3ViewAbi } = require("../../abi/compoundV3/abis");
const { addresses } = require("../../utils");

const COMP_V3_MARKETS = {
    1: {
        USDC: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        USDS: "0x5D409e56D886231aDAf00c8775665AD0f9897b56",
        USDT: "0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840",
        WETH: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
        wstETH: "0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3"
    },
    42161: {
        USDC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
        USDCe: "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
        USDT: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
        WETH: "0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486"
    },
    8453: {
        USDC: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
        USDCbC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
        WETH: "0x46e6b214b524310239732D51387075E0e70970bf",
        AERO: "0x784efeB622244d2348d4F2522f8860B96fbEcE89",
        USDS: "0x2c776041CCFe903071AF44aa147368a9c8EEA518"
    },
    10: {
        USDC: "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB",
        USDT: "0x995E394b8B2437aC8Ce61Ee0bC610D617962B214",
        WETH: "0xE36A30D249f7761327fd973001A32010b521b6Fd"
    }
};

/**
 * returns Compound V3 position data
 * @param {string} market compoundV3 market address
 * @param {string} user user address of compound position
 * @returns {Object} object with user position data
 */
async function getLoanData(market, user) {
    const [signer] = await hre.ethers.getSigners();
    const { chainId } = await hre.ethers.provider.getNetwork();

    const compV3ViewAddress = addresses[chainId].COMP_V3_VIEW;

    const view = new hre.ethers.Contract(compV3ViewAddress, compoundV3ViewAbi, signer);

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
    getLoanData,
    COMP_V3_MARKETS
};
