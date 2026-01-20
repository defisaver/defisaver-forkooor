/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const { subLiquityV2LeverageManagement, subLiquityV2CloseToPrice, subLiquityV2LeverageManagementOnPrice, subLiquityV2Payback, subLiquityV2InterestRateAdjustmentBundle } = require("../../helpers/liquityV2/strategies");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /liquity/v2/strategies/leverage-management:
 *   post:
 *     summary: Subscribe to a LiquityV2 leverage management strategy
 *     tags:
 *      - LiquityV2
 *     description: Subscribes to Liquity V2 leverage management strategy for Smart Wallet positions
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
 *               - market
 *               - troveId
 *               - triggerRatio
 *               - targetRatio
 *               - ratioState
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Liquity V2 market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "ID of the trove"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *                description: "Trigger ratio for the strategy"
 *              targetRatio:
 *                 type: number
 *                 example: 300
 *                 description: "Target ratio for the strategy"
 *              ratioState:
 *                 type: integer
 *                 example: 1
 *                 description: "1 for UNDER/REPAY and 2 for OVER/BOOST"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                 subId:
 *                  type: string
 *                  example: "1509"
 *       '400':
 *         description: Bad request - validation errors
 *       '500':
 *         description: Internal Server Error
 */
router.post("/leverage-management",
    body(["vnetUrl", "eoa", "market", "troveId", "triggerRatio", "targetRatio", "ratioState"]).notEmpty(),
    body("ratioState").isInt({ min: 1, max: 2 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, troveId, triggerRatio, targetRatio, ratioState } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subLiquityV2LeverageManagement(
            eoa,
            market,
            troveId,
            triggerRatio,
            targetRatio,
            ratioState,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to LiquityV2 leverage management strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/strategies/leverage-management-on-price:
 *   post:
 *     summary: Subscribe to a LiquityV2 leverage management on price strategy
 *     tags:
 *      - LiquityV2
 *     description: Subscribes to Liquity V2 leverage management on price strategy for Smart Wallet positions
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
 *               - market
 *               - troveId
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *               - isRepayOnPrice
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Liquity V2 market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "ID of the trove"
 *              triggerPrice:
 *                type: number
 *                example: 3000
 *                description: "Trigger price threshold"
 *              priceState:
 *                 type: integer
 *                 example: 0
 *                 description: "0 for OVER, 1 for UNDER"
 *              targetRatio:
 *                 type: number
 *                 example: 300
 *                 description: "Target ratio"
 *              isRepayOnPrice:
 *                 type: boolean
 *                 example: true
 *                 description: "true for REPAY ON PRICE, false for BOOST ON PRICE"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                  example: [
 *                       "37",
 *                       true,
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9df4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f0000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"
 *                       ],
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
 *                           "0xf4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x00000000000000000000000000000000000000000000000029a2241af62c0000",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                       ]
 *                  ]
 *                 subId:
 *                  type: string
 *                  example: "1509"
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
    body(["vnetUrl", "eoa", "market", "troveId", "triggerPrice", "priceState", "targetRatio", "isRepayOnPrice"]).notEmpty(),
    body("priceState").isInt({ min: 0, max: 1 }),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    body("isRepayOnPrice").isBoolean(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, troveId, triggerPrice, priceState, targetRatio, isRepayOnPrice } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subLiquityV2LeverageManagementOnPrice(
            eoa,
            market,
            troveId,
            triggerPrice,
            priceState,
            targetRatio,
            isRepayOnPrice,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to LiquityV2 leverage management on price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/strategies/close-on-price:
 *   post:
 *     summary: Subscribe to a LiquityV2 close on price strategy
 *     tags:
 *      - LiquityV2
 *     description: Subscribes to Liquity V2 close on price strategy for Smart Wallet positions
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
 *               - market
 *               - troveId
 *               - closeStrategyType
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Liquity V2 market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "ID of the trove"
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
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                  example: [
 *                       "39",
 *                       true,
 *                       [
 *                           "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000005d21dba000"
 *                       ],
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
 *                           "0x39505467c59c505c8f15abacf80f39cef19301f78b2fbc5221b33b8cb2199a6b",
 *                           "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *                           "0x000000000000000000000000437245433738c1f320c6b4de1aede588e4fb4748",
 *                           "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000004"
 *                       ]
 *                  ]
 *                 subId:
 *                  type: string
 *                  example: "1509"
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
    body(["vnetUrl", "eoa", "market", "troveId", "closeStrategyType"]).notEmpty(),
    body("stopLossPrice").isFloat({ min: 0 }),
    body("takeProfitPrice").isFloat({ min: 0 }),
    body("closeStrategyType").isInt({ min: 0, max: 7 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, troveId, stopLossPrice, takeProfitPrice, closeStrategyType } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subLiquityV2CloseToPrice(
            eoa,
            market,
            troveId,
            stopLossPrice || 0,
            takeProfitPrice || 0,
            closeStrategyType,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to LiquityV2 close on price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/strategies/payback:
 *   post:
 *     summary: Subscribe to a LiquityV2 payback strategy
 *     tags:
 *      - LiquityV2
 *     description: Subscribes to Liquity V2 payback strategy for Smart Wallet positions
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
 *               - market
 *               - troveId
 *               - triggerRatio
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Liquity V2 market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "ID of the trove"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *                description: "Trigger ratio for the strategy"
 *              targetRatio:
 *                 type: number
 *                 example: 300
 *                 description: "Target ratio for the strategy"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                  example: [
 *                       "37",
 *                       true,
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9df4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f0000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"
 *                       ],
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
 *                           "0xf4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x00000000000000000000000000000000000000000000000029a2241af62c0000",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                       ]
 *                  ]
 *                 subId:
 *                  type: string
 *                  example: "1509"
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
router.post("/payback",
    body(["vnetUrl", "eoa", "market", "troveId", "triggerRatio", "targetRatio"]).notEmpty(),
    body("triggerRatio").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, troveId, triggerRatio, targetRatio } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subLiquityV2Payback(
            eoa,
            market,
            troveId,
            triggerRatio,
            targetRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to LiquityV2 payback strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/strategies/interest-rate-adjustment:
 *   post:
 *     summary: Subscribe to a LiquityV2 interest rate adjustment strategy
 *     tags:
 *      - LiquityV2
 *     description: Subscribes to Liquity V2 interest rate adjustment strategy for Smart Wallet positions
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
 *               - market
 *               - troveId
 *               - criticalDebtInFrontLimit
 *               - nonCriticalDebtInFrontLimit
 *               - interestRateChange
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Liquity V2 market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "ID of the trove"
 *              criticalDebtInFrontLimit:
 *                type: number
 *                example: 10000000
 *                description: "Critical debt in front limit (whole numbers, e.g., 10000000 for 10 million)"
 *              nonCriticalDebtInFrontLimit:
 *                type: number
 *                example: 5000000
 *                description: "Non-critical debt in front limit (whole numbers, e.g., 5000000 for 5 million)"
 *              interestRateChange:
 *                type: number
 *                example: 4.5
 *                description: "Interest rate change (e.g., 4.5 for 4.5%)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                  example: [
 *                       "40",
 *                       true,
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9df4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f0000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"
 *                       ],
 *                       [
 *                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
 *                           "0xf4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x00000000000000000000000000000000000000000000000029a2241af62c0000",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                           "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                       ]
 *                  ]
 *                 subId:
 *                  type: string
 *                  example: "1509"
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
router.post("/interest-rate-adjustment",
    body(["vnetUrl", "eoa", "market", "troveId", "criticalDebtInFrontLimit", "nonCriticalDebtInFrontLimit", "interestRateChange"]).notEmpty(),
    body("criticalDebtInFrontLimit").isNumeric(),
    body("nonCriticalDebtInFrontLimit").isNumeric(),
    body("interestRateChange").isFloat(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, troveId, criticalDebtInFrontLimit, nonCriticalDebtInFrontLimit, interestRateChange } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subLiquityV2InterestRateAdjustmentBundle(
            eoa,
            market,
            troveId,
            criticalDebtInFrontLimit,
            nonCriticalDebtInFrontLimit,
            interestRateChange,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to LiquityV2 interest rate adjustment strategy with error: ${err.toString()}` });
            });
    });


module.exports = router;
