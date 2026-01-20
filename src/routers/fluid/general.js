/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getWalletAddr } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { getPositionByNftId } = require("../../helpers/fluid/view");
const { fluidT1Open } = require("../../helpers/fluid/general");

const router = express.Router();

/**
 * @swagger
 * /fluid/general/get-position-by-nft:
 *   post:
 *     summary: Fetch info about Fluid position by NFT id
 *     tags:
 *      - Fluid
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              nftId:
 *                type: string
 *                example: "10"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: object
 *                   properties:
 *                     nftId:
 *                       type: string
 *                       example: "1566"
 *                       description: "NFT id of the position"
 *                     owner:
 *                       type: string
 *                       example: "0x9600A48ed0f931d0c422D574e3275a90D8b22745"
 *                       description: "Owner address of the position"
 *                     isLiquidated:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the position has been liquidated"
 *                     isSupplyPosition:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if this is a supply position"
 *                     supply:
 *                       type: string
 *                       example: "25933541888169865117706"
 *                       description: "Amount of collateral supplied in the position"
 *                     borrow:
 *                       type: string
 *                       example: "28140473070287130764889"
 *                       description: "Amount of debt borrowed in the position"
 *                     ratio:
 *                       type: string
 *                       example: "1600000000000000000"
 *                       description: "Current collateral ratio of the position"
 *                     tick:
 *                       type: string
 *                       example: "44"
 *                       description: "Tick associated with the position"
 *                     tickId:
 *                       type: string
 *                       example: "1"
 *                       description: "Tick ID of the position"
 *                 vaultData:
 *                   type: object
 *                   properties:
 *                     vault:
 *                       type: string
 *                       example: "0x82B27fA821419F5689381b565a8B0786aA2548De"
 *                       description: "Address of the Fluid Vault"
 *                     vaultId:
 *                       type: string
 *                       example: "13"
 *                       description: "ID of the Fluid Vault"
 *                     vaultType:
 *                       type: string
 *                       example: "10000"
 *                       description: "Type identifier for the Fluid Vault"
 *                     isSmartColl:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the vault supports smart collateral"
 *                     isSmartDebt:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the vault supports smart debt"
 *                     supplyToken0:
 *                       type: string
 *                       example: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
 *                       description: "Address of the primary collateral token"
 *                     supplyToken1:
 *                       type: string
 *                       example: "0x0000000000000000000000000000000000000000"
 *                       description: "Address of the secondary collateral token (if applicable)"
 *                     borrowToken0:
 *                       type: string
 *                       example: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
 *                       description: "Address of the primary borrow token"
 *                     borrowToken1:
 *                       type: string
 *                       example: "0x0000000000000000000000000000000000000000"
 *                       description: "Address of the secondary borrow token (if applicable)"
 *                     supplyToken0Decimals:
 *                       type: string
 *                       example: "18"
 *                       description: "Number of decimals for the primary collateral token"
 *                     supplyToken1Decimals:
 *                       type: string
 *                       example: "0"
 *                       description: "Number of decimals for the secondary collateral token"
 *                     borrowToken0Decimals:
 *                       type: string
 *                       example: "18"
 *                       description: "Number of decimals for the primary borrow token"
 *                     borrowToken1Decimals:
 *                       type: string
 *                       example: "0"
 *                       description: "Number of decimals for the secondary borrow token"
 *                     collateralFactor:
 *                       type: string
 *                       example: "9500"
 *                       description: "Collateral factor (scaled by 100)"
 *                     liquidationThreshold:
 *                       type: string
 *                       example: "9700"
 *                       description: "Liquidation threshold (scaled by 100)"
 *                     liquidationMaxLimit:
 *                       type: string
 *                       example: "9800"
 *                       description: "Maximum liquidation limit (scaled by 100)"
 *                     withdrawalGap:
 *                       type: string
 *                       example: "500"
 *                       description: "Gap before withdrawal is allowed (scaled by 100)"
 *                     liquidationPenalty:
 *                       type: string
 *                       example: "10"
 *                       description: "Liquidation penalty percentage (scaled by 100)"
 *                     borrowFee:
 *                       type: string
 *                       example: "0"
 *                       description: "Borrow fee percentage (scaled by 100)"
 *                     oracle:
 *                       type: string
 *                       example: "0xadE0948e2431DEFB87e75760e94f190cbF35E95b"
 *                       description: "Address of the oracle contract used for pricing"
 *                     oraclePriceOperate:
 *                       type: string
 *                       example: "1191962749225013727000000000"
 *                       description: "Price of the collateral token used for operations"
 *                     oraclePriceLiquidate:
 *                       type: string
 *                       example: "1191962749225013727000000000"
 *                       description: "Price of the collateral token used for liquidations"
 *                     vaultSupplyExchangePrice:
 *                       type: string
 *                       example: "1004337808574"
 *                       description: "Exchange price of supply tokens in the vault"
 *                     vaultBorrowExchangePrice:
 *                       type: string
 *                       example: "1020312827526"
 *                       description: "Exchange price of borrow tokens in the vault"
 *                     supplyRateVault:
 *                       type: string
 *                       example: "24"
 *                       description: "Supply interest rate in the vault"
 *                     borrowRateVault:
 *                       type: string
 *                       example: "295"
 *                       description: "Borrow interest rate in the vault"
 *                     rewardsOrFeeRateSupply:
 *                       type: string
 *                       example: "0"
 *                       description: "Rewards or fee rate for supplying assets"
 *                     rewardsOrFeeRateBorrow:
 *                       type: string
 *                       example: "0"
 *                       description: "Rewards or fee rate for borrowing assets"
 *                     totalPositions:
 *                       type: string
 *                       example: "44"
 *                       description: "Total number of positions in the vault"
 *                     totalSupplyVault:
 *                       type: string
 *                       example: "33054171599431809325098"
 *                       description: "Total supplied assets in the vault"
 *                     totalBorrowVault:
 *                       type: string
 *                       example: "35930015896889150989966"
 *                       description: "Total borrowed assets in the vault"
 *                     withdrawalLimit:
 *                       type: string
 *                       example: "24790628699581481720453"
 *                       description: "Maximum withdrawal limit in the vault"
 *                     withdrawableUntilLimit:
 *                       type: string
 *                       example: "8263542899860493906818"
 *                       description: "Assets that can be withdrawn until the limit is reached"
 *                     withdrawable:
 *                       type: string
 *                       example: "8263542899860493906818"
 *                       description: "Currently withdrawable amount in the vault"
 *                     baseWithdrawalLimit:
 *                       type: string
 *                       example: "2384591359127650153653"
 *                       description: "Base withdrawal limit before expansion"
 *                     withdrawExpandPercent:
 *                       type: string
 *                       example: "2500"
 *                       description: "Percentage increase in withdrawal limit over time"
 *                     withdrawExpandDuration:
 *                       type: string
 *                       example: "43200"
 *                       description: "Duration for withdrawal limit expansion"
 *                     borrowLimit:
 *                       type: string
 *                       example: "43116009516018210240504"
 *                       description: "Maximum borrow limit in the vault"
 *                     borrowableUntilLimit:
 *                       type: string
 *                       example: "7186001586003035040084"
 *                       description: "Amount that can be borrowed until limit is reached"
 *                     borrowable:
 *                       type: string
 *                       example: "7186001586003035040084"
 *                       description: "Currently borrowable amount in the vault"
 *                     borrowLimitUtilization:
 *                       type: string
 *                       example: "61241073494526372046886"
 *                       description: "Utilization of the borrow limit"
 *                     maxBorrowLimit:
 *                       type: string
 *                       example: "74774379226018878825501"
 *                       description: "Maximum borrow limit in the vault"
 *                     borrowExpandPercent:
 *                       type: string
 *                       example: "2000"
 *                       description: "Percentage increase in borrow limit over time"
 *                     borrowExpandDuration:
 *                       type: string
 *                       example: "43200"
 *                       description: "Duration for borrow limit expansion"
 *                     baseBorrowLimit:
 *                       type: string
 *                       example: "2805994617921995060528"
 *                       description: "Base borrow limit before expansion"
 *                     minimumBorrowing:
 *                       type: string
 *                       example: "10204"
 *                       description: "Minimum borrowing amount allowed"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/get-position-by-nft",
    body(["vnetUrl", "nftId"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, nftId } = req.body;

        await setupVnet(vnetUrl, []);

        getPositionByNftId(nftId)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });


/**
 * @swagger
 * /fluid/general/create-t1:
 *   post:
 *     summary: Create Fluid Vault T1 position on a vnet. Regular position with 1 coll and 1 debt token.
 *     tags:
 *      - Fluid
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              vaultId:
 *                type: number
 *                example: 4
 *              collSymbol:
 *                type: string
 *                example: "wstETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 10
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              debtAmount:
 *                type: number
 *                example: 15000
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided"
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: object
 *                   properties:
 *                     nftId:
 *                       type: string
 *                       example: "1566"
 *                       description: "NFT id of the position"
 *                     owner:
 *                       type: string
 *                       example: "0x9600A48ed0f931d0c422D574e3275a90D8b22745"
 *                       description: "Owner address of the position"
 *                     isLiquidated:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the position has been liquidated"
 *                     isSupplyPosition:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if this is a supply position"
 *                     supply:
 *                       type: string
 *                       example: "25933541888169865117706"
 *                       description: "Amount of collateral supplied in the position"
 *                     borrow:
 *                       type: string
 *                       example: "28140473070287130764889"
 *                       description: "Amount of debt borrowed in the position"
 *                     ratio:
 *                       type: string
 *                       example: "1600000000000000000"
 *                       description: "Current collateral ratio of the position"
 *                     tick:
 *                       type: string
 *                       example: "44"
 *                       description: "Tick associated with the position"
 *                     tickId:
 *                       type: string
 *                       example: "1"
 *                       description: "Tick ID of the position"
 *                 vaultData:
 *                   type: object
 *                   properties:
 *                     vault:
 *                       type: string
 *                       example: "0x82B27fA821419F5689381b565a8B0786aA2548De"
 *                       description: "Address of the Fluid Vault"
 *                     vaultId:
 *                       type: string
 *                       example: "13"
 *                       description: "ID of the Fluid Vault"
 *                     vaultType:
 *                       type: string
 *                       example: "10000"
 *                       description: "Type identifier for the Fluid Vault"
 *                     isSmartColl:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the vault supports smart collateral"
 *                     isSmartDebt:
 *                       type: boolean
 *                       example: false
 *                       description: "Indicates if the vault supports smart debt"
 *                     supplyToken0:
 *                       type: string
 *                       example: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
 *                       description: "Address of the primary collateral token"
 *                     supplyToken1:
 *                       type: string
 *                       example: "0x0000000000000000000000000000000000000000"
 *                       description: "Address of the secondary collateral token (if applicable)"
 *                     borrowToken0:
 *                       type: string
 *                       example: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
 *                       description: "Address of the primary borrow token"
 *                     borrowToken1:
 *                       type: string
 *                       example: "0x0000000000000000000000000000000000000000"
 *                       description: "Address of the secondary borrow token (if applicable)"
 *                     supplyToken0Decimals:
 *                       type: string
 *                       example: "18"
 *                       description: "Number of decimals for the primary collateral token"
 *                     supplyToken1Decimals:
 *                       type: string
 *                       example: "0"
 *                       description: "Number of decimals for the secondary collateral token"
 *                     borrowToken0Decimals:
 *                       type: string
 *                       example: "18"
 *                       description: "Number of decimals for the primary borrow token"
 *                     borrowToken1Decimals:
 *                       type: string
 *                       example: "0"
 *                       description: "Number of decimals for the secondary borrow token"
 *                     collateralFactor:
 *                       type: string
 *                       example: "9500"
 *                       description: "Collateral factor (scaled by 100)"
 *                     liquidationThreshold:
 *                       type: string
 *                       example: "9700"
 *                       description: "Liquidation threshold (scaled by 100)"
 *                     liquidationMaxLimit:
 *                       type: string
 *                       example: "9800"
 *                       description: "Maximum liquidation limit (scaled by 100)"
 *                     withdrawalGap:
 *                       type: string
 *                       example: "500"
 *                       description: "Gap before withdrawal is allowed (scaled by 100)"
 *                     liquidationPenalty:
 *                       type: string
 *                       example: "10"
 *                       description: "Liquidation penalty percentage (scaled by 100)"
 *                     borrowFee:
 *                       type: string
 *                       example: "0"
 *                       description: "Borrow fee percentage (scaled by 100)"
 *                     oracle:
 *                       type: string
 *                       example: "0xadE0948e2431DEFB87e75760e94f190cbF35E95b"
 *                       description: "Address of the oracle contract used for pricing"
 *                     oraclePriceOperate:
 *                       type: string
 *                       example: "1191962749225013727000000000"
 *                       description: "Price of the collateral token used for operations"
 *                     oraclePriceLiquidate:
 *                       type: string
 *                       example: "1191962749225013727000000000"
 *                       description: "Price of the collateral token used for liquidations"
 *                     vaultSupplyExchangePrice:
 *                       type: string
 *                       example: "1004337808574"
 *                       description: "Exchange price of supply tokens in the vault"
 *                     vaultBorrowExchangePrice:
 *                       type: string
 *                       example: "1020312827526"
 *                       description: "Exchange price of borrow tokens in the vault"
 *                     supplyRateVault:
 *                       type: string
 *                       example: "24"
 *                       description: "Supply interest rate in the vault"
 *                     borrowRateVault:
 *                       type: string
 *                       example: "295"
 *                       description: "Borrow interest rate in the vault"
 *                     rewardsOrFeeRateSupply:
 *                       type: string
 *                       example: "0"
 *                       description: "Rewards or fee rate for supplying assets"
 *                     rewardsOrFeeRateBorrow:
 *                       type: string
 *                       example: "0"
 *                       description: "Rewards or fee rate for borrowing assets"
 *                     totalPositions:
 *                       type: string
 *                       example: "44"
 *                       description: "Total number of positions in the vault"
 *                     totalSupplyVault:
 *                       type: string
 *                       example: "33054171599431809325098"
 *                       description: "Total supplied assets in the vault"
 *                     totalBorrowVault:
 *                       type: string
 *                       example: "35930015896889150989966"
 *                       description: "Total borrowed assets in the vault"
 *                     withdrawalLimit:
 *                       type: string
 *                       example: "24790628699581481720453"
 *                       description: "Maximum withdrawal limit in the vault"
 *                     withdrawableUntilLimit:
 *                       type: string
 *                       example: "8263542899860493906818"
 *                       description: "Assets that can be withdrawn until the limit is reached"
 *                     withdrawable:
 *                       type: string
 *                       example: "8263542899860493906818"
 *                       description: "Currently withdrawable amount in the vault"
 *                     baseWithdrawalLimit:
 *                       type: string
 *                       example: "2384591359127650153653"
 *                       description: "Base withdrawal limit before expansion"
 *                     withdrawExpandPercent:
 *                       type: string
 *                       example: "2500"
 *                       description: "Percentage increase in withdrawal limit over time"
 *                     withdrawExpandDuration:
 *                       type: string
 *                       example: "43200"
 *                       description: "Duration for withdrawal limit expansion"
 *                     borrowLimit:
 *                       type: string
 *                       example: "43116009516018210240504"
 *                       description: "Maximum borrow limit in the vault"
 *                     borrowableUntilLimit:
 *                       type: string
 *                       example: "7186001586003035040084"
 *                       description: "Amount that can be borrowed until limit is reached"
 *                     borrowable:
 *                       type: string
 *                       example: "7186001586003035040084"
 *                       description: "Currently borrowable amount in the vault"
 *                     borrowLimitUtilization:
 *                       type: string
 *                       example: "61241073494526372046886"
 *                       description: "Utilization of the borrow limit"
 *                     maxBorrowLimit:
 *                       type: string
 *                       example: "74774379226018878825501"
 *                       description: "Maximum borrow limit in the vault"
 *                     borrowExpandPercent:
 *                       type: string
 *                       example: "2000"
 *                       description: "Percentage increase in borrow limit over time"
 *                     borrowExpandDuration:
 *                       type: string
 *                       example: "43200"
 *                       description: "Duration for borrow limit expansion"
 *                     baseBorrowLimit:
 *                       type: string
 *                       example: "2805994617921995060528"
 *                       description: "Base borrow limit before expansion"
 *                     minimumBorrowing:
 *                       type: string
 *                       example: "10204"
 *                       description: "Minimum borrowing amount allowed"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/create-t1",
    body(["vnetUrl", "vaultId", "collSymbol", "collAmount", "debtSymbol", "debtAmount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, vaultId, collSymbol, collAmount, debtSymbol, debtAmount, owner } = req.body;

        await setupVnet(vnetUrl, [owner]);

        fluidT1Open(
            vaultId, collSymbol, collAmount, debtSymbol, debtAmount, owner, getWalletAddr(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
