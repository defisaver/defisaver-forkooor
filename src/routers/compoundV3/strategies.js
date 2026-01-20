/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getWalletAddr, defaultsToSafe } = require("../../utils");
const { subCompoundV3AutomationStrategy, subCompoundV3LeverageManagementOnPrice, subCompoundV3CloseOnPrice, subCompoundV3LeverageManagement } = require("../../helpers/compoundV3/strategies");

const router = express.Router();

/**
 * @swagger
 * /compound/v3/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a Compound V3 Automation strategy
 *     tags:
 *      - CompoundV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              market:
 *                type: string
 *                example: "0xc3d688B66703497DAA19211EEdff47f25384cdc3"
 *              baseToken:
 *                type: string
 *                example: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
 *                description: "Base token for market, e.g. USDC coin address"
 *              minRatio:
 *                type: integer
 *                example: 200
 *              maxRatio:
 *                 type: integer
 *                 example: 300
 *              targetRepayRatio:
 *                 type: integer
 *                 example: 220
 *              targetBoostRatio:
 *                 type: integer
 *                 example: 250
 *              boostEnabled:
 *                 type: boolean
 *                 example: true
 *              isEOA:
 *                 type: boolean
 *                 example: false
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
 *                 strategySub:
 *                   type: Array
 *                   example: { "subId": "561",
 *                              "strategySub": [
 *                              31048,
 *                              "1500000000000000000",
 *                              "2000000000000000000",
 *                              "1800000000000000000",
 *                              "1800000000000000000",
 *                              true
 *                             ]}
 *                 subId:
 *                   type: string
 *                   example: "230"
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
router.post("/dfs-automation", async (req, res) => {
    try {
        const {
            vnetUrl,
            owner,
            market,
            baseToken,
            minRatio,
            maxRatio,
            targetRepayRatio,
            targetBoostRatio,
            boostEnabled,
            isEOA
        } = req.body;

        await setupVnet(vnetUrl, [owner]);

        const sub = await subCompoundV3AutomationStrategy(
            owner,
            market,
            baseToken,
            minRatio,
            maxRatio,
            targetRepayRatio,
            targetBoostRatio,
            boostEnabled,
            isEOA,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        const e = {
            error: `Failed to subscribe to Compound V3 automation strategy with error : ${err.toString()}`
        };

        res.status(500).send(e);
    }
});

/**
 * @swagger
 * /compound/v3/strategies/leverage-management:
 *   post:
 *     summary: Subscribe to a Compound V3 leverage management strategy
 *     tags:
 *      - CompoundV3
 *     description: >
 *      MAINNNET BUNDLES:<br/>
 *          &nbsp;&nbsp;SW_REPAY = 28 [15, 82]<br/>
 *          &nbsp;&nbsp;SW_BOOST = 29 [19, 83]<br/>
 *          &nbsp;&nbsp;EOA_REPAY = 30 [23, 84]<br/>
 *          &nbsp;&nbsp;EOA_BOOST = 31 [27, 85]<br/><br/>
 *      ARBITRUM BUNDLES:<br/>
 *          &nbsp;&nbsp;SW_REPAY = 4 [10, 11]<br/>
 *          &nbsp;&nbsp;SW_BOOST = 5 [12, 13]<br/><br/>
 *      BASE BUNDLES:<br/>
 *          &nbsp;&nbsp;SW_REPAY = 4 [10, 11]<br/>
 *          &nbsp;&nbsp;SW_BOOST = 5 [12, 13]<br/><br/>
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              bundleId:
 *                type: string
 *                example: "28"
 *                description: "For mainnet 28 = sw repay; 29 = sw boost; 30 = eoa repay; 31 = eoa boost"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Symbol of the market token (e.g., USDC, ETH, WETH)"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *                description: "Ratio at which the strategy will trigger"
 *              targetRatio:
 *                type: number
 *                example: 250
 *                description: "Target ratio after the strategy executes"
 *              ratioState:
 *                type: string
 *                example: "under"
 *                description: "Ratio state trigger condition ('under' or 'over')"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions"
 *              proxyAddr:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "The address of the wallet"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "230"
 *                   description: "ID of the created subscription"
 *                 strategySub:
 *                   type: array
 *                   description: "Strategy subscription details"
 *                   example: [
 *                     "28",
 *                     true,
 *                     ["0x..."],
 *                     ["0x...", "0x...", "0x...", "0x..."]
 *                   ]
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
router.post("/leverage-management", async (req, res) => {
    try {
        const {
            vnetUrl,
            bundleId,
            marketSymbol,
            triggerRatio,
            targetRatio,
            ratioState,
            eoa,
            proxyAddr,
            isEOA
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        const sub = await subCompoundV3LeverageManagement(
            bundleId,
            marketSymbol,
            triggerRatio,
            targetRatio,
            ratioState,
            eoa,
            proxyAddr,
            isEOA
        );

        res.status(200).send(sub);
    } catch (err) {
        const e = {
            error: `Failed to subscribe to Compound V3 leverage management strategy with error : ${err.toString()}`
        };

        res.status(500).send(e);
    }
});

/**
 * @swagger
 * /compound/v3/strategies/leverage-management-on-price:
 *   post:
 *     summary: Subscribe to a Compound V3 leverage management on price strategy
 *     tags:
 *      - CompoundV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              bundleId:
 *                type: string
 *                example: "for mainnet 46 = repayOnPrice; 47 = boostOnPrice; 49 = eoa repayOnPrice; 50 = eoa boostOnPrice"
 *                description: "ID of the bundle to subscribe to"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              targetRatio:
 *                type: number
 *                example: 200
 *                description: "Target ratio for the leverage management"
 *              price:
 *                type: number
 *                example: 2000
 *                description: "Price threshold for triggering the strategy"
 *              priceState:
 *                type: string
 *                example: "under"
 *                description: "Price state trigger condition ('under' or 'over')"
 *              ratioState:
 *                type: string
 *                example: "under"
 *                description: "'under' for repay on price or 'over' for boost on price"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions"
 *              proxyAddr:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "The address of the wallet"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "230"
 *                   description: "ID of the created subscription"
 *                 strategySub:
 *                   type: array
 *                   description: "Strategy subscription details"
 *                   example: [
 *                     "42",
 *                     "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
 *                     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
 *                     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
 *                     "200",
 *                     "2000",
 *                     "0"
 *                   ]
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
router.post("/leverage-management-on-price", async (req, res) => {
    try {
        const {
            vnetUrl,
            bundleId,
            isEOA,
            debtSymbol,
            collSymbol,
            targetRatio,
            price,
            priceState,
            ratioState,
            eoa,
            proxyAddr
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        const sub = await subCompoundV3LeverageManagementOnPrice(
            bundleId,
            debtSymbol,
            collSymbol,
            targetRatio,
            price,
            priceState,
            ratioState,
            eoa,
            proxyAddr,
            isEOA
        );

        res.status(200).send(sub);
    } catch (err) {
        const e = {
            error: `Failed to subscribe to Compound V3 leverage management on price strategy with error : ${err.toString()}`
        };

        res.status(500).send(e);
    }
});

/**
 * @swagger
 * /compound/v3/strategies/close-on-price:
 *   post:
 *     summary: Subscribe to a Compound V3 close on price strategy
 *     tags:
 *      - CompoundV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              bundleId:
 *                type: string
 *                example: "for mainnet 48 = closeOnPrice; 51 = eoa closeOnPrice"
 *                description: "ID of the bundle to subscribe to"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              stopLossPrice:
 *                type: integer
 *                example: 1500
 *                description: "Lower price for stop loss. Pass 0 if only subscribing to take profit."
 *              takeProfitPrice:
 *                 type: integer
 *                 example: 4000
 *                 description: "Upper price for take profit. Pass 0 if only subscribing to stop loss."
 *              closeStrategyType:
 *                 type: number
 *                 example: 5
 *                 description: "0=TakeProfitColl, 1=StopLossColl, 2=TakeProfitDebt, 3=StopLossDebt, 4=TakeProfitCollStopLossColl, 5=TakeProfitCollStopLossDebt, 6=TakeProfitDebtStopLossDebt, 7=TakeProfitDebtStopLossColl"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions"
 *              proxyAddr:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "The address of the wallet"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "230"
 *                   description: "ID of the created subscription"
 *                 strategySub:
 *                   type: array
 *                   description: "Strategy subscription details"
 *                   example: [
 *                     "42",
 *                     "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
 *                     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
 *                     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
 *                     "1800",
 *                     "0",
 *                     "2200",
 *                     "1"
 *                   ]
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
router.post("/close-on-price", async (req, res) => {
    try {
        const {
            vnetUrl,
            bundleId,
            isEOA,
            debtSymbol,
            collSymbol,
            stopLossPrice,
            takeProfitPrice,
            closeStrategyType,
            eoa,
            proxyAddr
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        const sub = await subCompoundV3CloseOnPrice(
            bundleId,
            debtSymbol,
            collSymbol,
            stopLossPrice,
            takeProfitPrice,
            closeStrategyType,
            eoa,
            proxyAddr,
            isEOA
        );

        res.status(200).send(sub);
    } catch (err) {
        const e = {
            error: `Failed to subscribe to Compound V3 close on price strategy with error : ${err.toString()}`
        };

        res.status(500).send(e);
    }
});

module.exports = router;
