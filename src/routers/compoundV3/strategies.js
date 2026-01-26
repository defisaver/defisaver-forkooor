/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { subCompoundV3AutomationStrategy, subCompoundV3LeverageManagement, subCompoundV3LeverageManagementOnPrice, subCompoundV3CloseOnPrice } = require("../../helpers/compoundV3/strategies");
const { body, validationResult } = require("express-validator");

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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - debtSymbol
 *               - minRatio
 *               - maxRatio
 *               - targetRepayRatio
 *               - targetBoostRatio
 *               - boostEnabled
 *               - isEOA
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "RPC URL of the Tenderly vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol."
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt (base) token symbol; market resolved from marketSymbol or debtSymbol. ETH → WETH."
 *              minRatio:
 *                type: number
 *                example: 200
 *              maxRatio:
 *                 type: number
 *                 example: 300
 *              targetRepayRatio:
 *                 type: number
 *                 example: 220
 *              targetBoostRatio:
 *                 type: number
 *                 example: 250
 *              boostEnabled:
 *                 type: boolean
 *                 example: true
 *              isEOA:
 *                 type: boolean
 *                 example: false
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided. Optional, defaults to safe"
 *     responses:
 *       '400':
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
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
router.post("/dfs-automation",
    body(["vnetUrl", "eoa", "debtSymbol", "minRatio", "maxRatio", "targetRepayRatio", "targetBoostRatio", "boostEnabled", "isEOA"]).notEmpty(),
    body(["minRatio", "maxRatio", "targetRepayRatio", "targetBoostRatio"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const {
                vnetUrl,
                eoa,
                marketSymbol,
                debtSymbol,
                minRatio,
                maxRatio,
                targetRepayRatio,
                targetBoostRatio,
                boostEnabled,
                isEOA
            } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCompoundV3AutomationStrategy(
                marketSymbol || null,
                eoa,
                debtSymbol,
                minRatio,
                maxRatio,
                targetRepayRatio,
                targetBoostRatio,
                boostEnabled,
                isEOA,
                getSmartWallet(req),
                defaultsToSafe(req)
            );

            return res.status(200).send(sub);
        } catch (err) {
            return res.status(500).send({ error: `Failed to subscribe to Compound V3 automation strategy with error : ${err.toString()}` });
        }
    });

/**
 * @swagger
 * /compound/v3/strategies/leverage-management:
 *   post:
 *     summary: Subscribe to a Compound V3 leverage management strategy
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - debtSymbol
 *               - triggerRatio
 *               - targetRatio
 *               - ratioState
 *               - isEOA
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "RPC URL of the Tenderly vnet"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol."
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt (base) token symbol; market resolved from marketSymbol or debtSymbol. ETH → WETH."
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
 *                enum: [under, over]
 *                example: "under"
 *                description: "Ratio state trigger condition ('under' or 'over')"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *              smartWallet:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
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
 *       '400':
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
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
router.post("/leverage-management",
    body(["vnetUrl", "debtSymbol", "triggerRatio", "targetRatio", "ratioState", "eoa", "isEOA"]).notEmpty(),
    body(["triggerRatio", "targetRatio"]).isFloat({ gt: 0 }),
    body("ratioState").isIn(["under", "over"]),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const {
                vnetUrl,
                marketSymbol,
                debtSymbol,
                triggerRatio,
                targetRatio,
                ratioState,
                eoa,
                isEOA
            } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCompoundV3LeverageManagement(
                marketSymbol || null,
                eoa,
                debtSymbol,
                triggerRatio,
                targetRatio,
                ratioState,
                isEOA,
                getSmartWallet(req)
            );

            return res.status(200).send(sub);
        } catch (err) {
            return res.status(500).send({ error: `Failed to subscribe to Compound V3 leverage management strategy with error : ${err.toString()}` });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - isEOA
 *               - collSymbol
 *               - debtSymbol
 *               - targetRatio
 *               - price
 *               - priceState
 *               - ratioState
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "RPC URL of the Tenderly vnet"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol."
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH → WETH."
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol; market resolved from marketSymbol or debtSymbol. ETH → WETH."
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
 *                enum: [under, over]
 *                example: "under"
 *                description: "Price state trigger condition ('under' or 'over')"
 *              ratioState:
 *                type: string
 *                enum: [under, over]
 *                example: "under"
 *                description: "'under' for repay on price or 'over' for boost on price"
 *              smartWallet:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
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
 *       '400':
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
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
router.post("/leverage-management-on-price",
    body(["vnetUrl", "isEOA", "debtSymbol", "collSymbol", "targetRatio", "price", "priceState", "ratioState", "eoa"]).notEmpty(),
    body(["targetRatio", "price"]).isFloat({ gt: 0 }),
    body(["priceState", "ratioState"]).isIn(["under", "over"]),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const {
                vnetUrl,
                isEOA,
                marketSymbol,
                debtSymbol,
                collSymbol,
                targetRatio,
                price,
                priceState,
                ratioState,
                eoa
            } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCompoundV3LeverageManagementOnPrice(
                marketSymbol || null,
                eoa,
                isEOA,
                collSymbol,
                debtSymbol,
                targetRatio,
                price,
                priceState,
                ratioState,
                getSmartWallet(req)
            );

            return res.status(200).send(sub);
        } catch (err) {
            return res.status(500).send({ error: `Failed to subscribe to Compound V3 leverage management on price strategy with error : ${err.toString()}` });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - isEOA
 *               - collSymbol
 *               - debtSymbol
 *               - stopLossPrice
 *               - takeProfitPrice
 *               - closeStrategyType
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "RPC URL of the Tenderly vnet"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              isEOA:
 *                type: boolean
 *                example: false
 *                description: "Whether the subscription is for an EOA"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol."
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH → WETH."
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol; market resolved from marketSymbol or debtSymbol. ETH → WETH."
 *              stopLossPrice:
 *                type: number
 *                example: 1500
 *                description: "Lower price for stop loss. Pass 0 if only subscribing to take profit."
 *              takeProfitPrice:
 *                 type: number
 *                 example: 4000
 *                 description: "Upper price for take profit. Pass 0 if only subscribing to stop loss."
 *              closeStrategyType:
 *                 type: integer
 *                 example: 5
 *                 description: "0=TakeProfitColl, 1=StopLossColl, 2=TakeProfitDebt, 3=StopLossDebt, 4=TakeProfitCollStopLossColl, 5=TakeProfitCollStopLossDebt, 6=TakeProfitDebtStopLossDebt, 7=TakeProfitDebtStopLossColl"
 *              smartWallet:
 *                type: string
 *                example: "0xAA28CaFdd40a8156E23b64b75C8fD9fdF28064Ed"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
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
 *       '400':
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
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
router.post("/close-on-price",
    body(["vnetUrl", "isEOA", "debtSymbol", "collSymbol", "stopLossPrice", "takeProfitPrice", "closeStrategyType", "eoa"]).notEmpty(),
    body(["stopLossPrice", "takeProfitPrice"]).isFloat({ min: 0 }),
    body("closeStrategyType").isInt({ min: 0, max: 7 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const {
                vnetUrl,
                isEOA,
                marketSymbol,
                debtSymbol,
                collSymbol,
                stopLossPrice,
                takeProfitPrice,
                closeStrategyType,
                eoa
            } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCompoundV3CloseOnPrice(
                marketSymbol || null,
                eoa,
                isEOA,
                collSymbol,
                debtSymbol,
                stopLossPrice,
                takeProfitPrice,
                closeStrategyType,
                getSmartWallet(req)
            );

            return res.status(200).send(sub);
        } catch (err) {
            return res.status(500).send({ error: `Failed to subscribe to Compound V3 close on price strategy with error : ${err.toString()}` });
        }
    });

module.exports = router;
