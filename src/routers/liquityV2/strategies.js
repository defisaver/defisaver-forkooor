/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getWalletAddr } = require("../../utils");
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
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Proxy owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                 type: integer
 *                 example: 300
 *              ratioState:
 *                 type: integer
 *                 example: 1
 *                 description: "1 for UNDER/REPAY and 2 for OVER/BOOST"
 *              bundleId:
 *                 type: string
 *                 example: 37
 *                 description: "Bundle ID"
 *              walletAddr:
 *                type: string
 *                example: "0x81bEbD4f70f1c354856d73bD3a0336238653dfd3"
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
router.post("/leverage-management", async (req, res) => {
    let resObj;

    try {
        const { vnetId, owner, market, troveId, triggerRatio, targetRatio, ratioState, bundleId } = req.body;

        await setupVnet(vnetId, [owner]);

        const sub = await subLiquityV2LeverageManagement(
            owner,
            market,
            troveId,
            triggerRatio,
            targetRatio,
            ratioState,
            bundleId,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 leverage management strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /liquity/v2/strategies/leverage-management-on-price:
 *   post:
 *     summary: Subscribe to a LiquityV2 leverage management on price strategy
 *     tags:
 *      - LiquityV2
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Proxy owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *              price:
 *                type: integer
 *                example: 3000
 *              state:
 *                 type: integer
 *                 example: 0
 *                 description: "0 for OVER, 1 for UNDER"
 *              targetRatio:
 *                 type: integer
 *                 example: 300
 *                 description: "Target ratio"
 *              isRepayOnPrice:
 *                 type: boolean
 *                 example: true
 *                 description: "true for REPAY ON PRICE, false for BOOST ON PRICE"
 *              bundleId:
 *                 type: string
 *                 example: 37
 *                 description: "Bundle ID"
 *              walletAddr:
 *                type: string
 *                example: "0x81bEbD4f70f1c354856d73bD3a0336238653dfd3"
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
router.post("/leverage-management-on-price", async (req, res) => {
    let resObj;

    try {
        const { vnetId, owner, market, troveId, price, state, targetRatio, isRepayOnPrice, bundleId } = req.body;

        await setupVnet(vnetId, [owner]);
        const sub = await subLiquityV2LeverageManagementOnPrice(
            owner,
            market,
            troveId,
            price,
            state,
            targetRatio,
            isRepayOnPrice,
            bundleId,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 leverage management on price strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /liquity/v2/strategies/close-on-price:
 *   post:
 *     summary: Subscribe to a LiquityV2 close on price strategy
 *     tags:
 *      - LiquityV2
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Wallet owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
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
 *              bundleId:
 *                 type: string
 *                 example: 39
 *                 description: "Bundle ID"
 *              walletAddr:
 *                type: string
 *                example: "0x81bEbD4f70f1c354856d73bD3a0336238653dfd3"
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
router.post("/close-on-price", body(
    [
        "vnetId",
        "owner",
        "market",
        "troveId",
        "closeStrategyType",
        "bundleId"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }

    let resObj;

    try {
        const {
            vnetId,
            owner,
            market,
            troveId,
            stopLossPrice,
            takeProfitPrice,
            closeStrategyType,
            bundleId
        } = req.body;

        await setupVnet(vnetId, [owner]);

        const sub = await subLiquityV2CloseToPrice(
            owner,
            market,
            troveId,
            stopLossPrice,
            takeProfitPrice,
            closeStrategyType,
            bundleId,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 leverage management strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /liquity/v2/strategies/payback:
 *   post:
 *     summary: Subscribe to a LiquityV2 payback strategy
 *     tags:
 *      - LiquityV2
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Proxy owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                 type: integer
 *                 example: 300
 *              walletAddr:
 *                type: string
 *                example: "0x81bEbD4f70f1c354856d73bD3a0336238653dfd3"
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
router.post("/payback", async (req, res) => {
    let resObj;

    try {
        const { vnetId, owner, market, troveId, triggerRatio, targetRatio } = req.body;

        await setupVnet(vnetId, [owner]);

        const sub = await subLiquityV2Payback(
            owner,
            market,
            troveId,
            triggerRatio,
            targetRatio,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 leverage management strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /liquity/v2/strategies/interest-rate-adjustment:
 *   post:
 *     summary: Subscribe to a LiquityV2 interest rate adjustment strategy
 *     tags:
 *      - LiquityV2
 *     description:
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Proxy owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *              criticalDebtInFrontLimit:
 *                type: integer
 *                example: 10000000
 *                description: "Critical debt in front limit (whole numbers, e.g., 10000000 for 10 million)"
 *              nonCriticalDebtInFrontLimit:
 *                type: integer
 *                example: 5000000
 *                description: "Non-critical debt in front limit (whole numbers, e.g., 5000000 for 5 million)"
 *              interestRateChange:
 *                type: number
 *                example: 4.5
 *                description: "Interest rate change (e.g., 4.5 for 4.5%)"
 *              walletAddr:
 *                type: string
 *                example: "0x81bEbD4f70f1c354856d73bD3a0336238653dfd3"
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
router.post("/interest-rate-adjustment", async (req, res) => {
    let resObj;

    try {
        const { vnetId, owner, market, troveId, criticalDebtInFrontLimit, nonCriticalDebtInFrontLimit, interestRateChange } = req.body;

        await setupVnet(vnetId, [owner]);

        const sub = await subLiquityV2InterestRateAdjustmentBundle(
            owner,
            market,
            troveId,
            criticalDebtInFrontLimit,
            nonCriticalDebtInFrontLimit,
            interestRateChange,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 interest rate adjustment strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});


module.exports = router;
