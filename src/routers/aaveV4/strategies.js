/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const {
    subAaveV4LeverageManagement,
    subAaveV4LeverageManagementOnPrice,
    subAaveV4CloseOnPrice,
    subAaveV4CollateralSwitch
} = require("../../helpers/aaveV4/strategies");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /aave/v4/strategies/leverage-management/boost:
 *   post:
 *     summary: Subscribe to Aave V4 Boost strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Boost strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Boost strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - targetRatio
 *               - triggerRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional - if not provided, the default spoke for the chain will be used."
 *               targetRatio:
 *                 type: number
 *                 example: 180
 *                 description: "Target ratio for the strategy"
 *               triggerRatio:
 *                 type: number
 *                 example: 200
 *                 description: "Trigger ratio for the strategy"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *                 description: "Whether to use Safe as smart wallet or dsproxy (default: safe)"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "12345"
 *                   description: "ID of the subscription"
 *                 strategySub:
 *                   type: object
 *                   description: "StrategySub object"
 *       '400':
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/leverage-management/boost",
    body(["vnetUrl", "eoa", "targetRatio", "triggerRatio"]).notEmpty(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, spoke, targetRatio, triggerRatio } = req.body;
        const ratioState = 0; // Boost

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4LeverageManagement(
            eoa,
            spoke,
            ratioState,
            targetRatio,
            triggerRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Boost strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/strategies/leverage-management/repay:
 *   post:
 *     summary: Subscribe to Aave V4 Repay strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Repay strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Repay strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - targetRatio
 *               - triggerRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional - if not provided, the default spoke for the chain will be used."
 *               targetRatio:
 *                 type: number
 *                 example: 200
 *                 description: "Target ratio for the strategy"
 *               triggerRatio:
 *                 type: number
 *                 example: 180
 *                 description: "Trigger ratio for the strategy"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *                 description: "Whether to use Safe as smart wallet or dsproxy (default: safe)"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "12345"
 *                   description: "ID of the subscription"
 *                 strategySub:
 *                   type: object
 *                   description: "StrategySub object"
 *       '400':
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/leverage-management/repay",
    body(["vnetUrl", "eoa", "targetRatio", "triggerRatio"]).notEmpty(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, spoke, targetRatio, triggerRatio } = req.body;
        const ratioState = 1; // Repay

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4LeverageManagement(
            eoa,
            spoke,
            ratioState,
            targetRatio,
            triggerRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Repay strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/strategies/leverage-management-on-price/boost:
 *   post:
 *     summary: Subscribe to Aave V4 Boost On Price strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Boost On Price strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Boost On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collSymbol
 *               - debtSymbol
 *               - targetRatio
 *               - price
 *               - priceState
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt asset symbol"
 *               targetRatio:
 *                 type: number
 *                 example: 180
 *                 description: "Target ratio for the strategy"
 *               price:
 *                 type: number
 *                 example: 2000
 *                 description: "Trigger price"
 *               priceState:
 *                 type: string
 *                 example: "under"
 *                 description: "Price state ('under' or 'over')"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                 strategySub:
 *                   type: object
 *       '400':
 *         description: Bad request - validation errors
 *       '500':
 *         description: Internal server error
 */
router.post("/leverage-management-on-price/boost",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "targetRatio", "price", "priceState"]).notEmpty(),
    body("priceState").isString().isIn(["under", "over", "UNDER", "OVER"]),
    body("targetRatio").isFloat({ gt: 0 }),
    body("price").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, spoke, collSymbol, debtSymbol, targetRatio, price, priceState } = req.body;
        const isBoost = true;

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4LeverageManagementOnPrice(
            eoa,
            spoke,
            isBoost,
            collSymbol,
            debtSymbol,
            targetRatio,
            price,
            priceState,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Boost On Price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/strategies/leverage-management-on-price/repay:
 *   post:
 *     summary: Subscribe to Aave V4 Repay On Price strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Repay On Price strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Repay On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collSymbol
 *               - debtSymbol
 *               - targetRatio
 *               - price
 *               - priceState
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt asset symbol"
 *               targetRatio:
 *                 type: number
 *                 example: 180
 *                 description: "Target ratio for the strategy"
 *               price:
 *                 type: number
 *                 example: 2000
 *                 description: "Trigger price"
 *               priceState:
 *                 type: string
 *                 example: "under"
 *                 description: "Price state ('under' or 'over')"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                 strategySub:
 *                   type: object
 *       '400':
 *         description: Bad request - validation errors
 *       '500':
 *         description: Internal server error
 */
router.post("/leverage-management-on-price/repay",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "targetRatio", "price", "priceState"]).notEmpty(),
    body("priceState").isString().isIn(["under", "over", "UNDER", "OVER"]),
    body("targetRatio").isFloat({ gt: 0 }),
    body("price").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, spoke, collSymbol, debtSymbol, targetRatio, price, priceState } = req.body;
        const isBoost = false;

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4LeverageManagementOnPrice(
            eoa,
            spoke,
            isBoost,
            collSymbol,
            debtSymbol,
            targetRatio,
            price,
            priceState,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Repay On Price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/strategies/close-on-price:
 *   post:
 *     summary: Subscribe to Aave V4 Close On Price strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Close On Price strategy with stop loss and take profit functionality.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Close On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collSymbol
 *               - debtSymbol
 *               - stopLossPrice
 *               - stopLossType
 *               - takeProfitPrice
 *               - takeProfitType
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt asset symbol"
 *               stopLossPrice:
 *                 type: number
 *                 example: 1800
 *                 description: "Stop loss price (0 if not used)"
 *               stopLossType:
 *                 type: integer
 *                 example: 0
 *                 description: "Stop loss type (0 for debt, 1 for collateral)"
 *               takeProfitPrice:
 *                 type: number
 *                 example: 2200
 *                 description: "Take profit price (0 if not used)"
 *               takeProfitType:
 *                 type: integer
 *                 example: 1
 *                 description: "Take profit type (0 for debt, 1 for collateral)"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                 strategySub:
 *                   type: object
 *       '400':
 *         description: Bad request - validation errors
 *       '500':
 *         description: Internal server error
 */
router.post("/close-on-price",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "stopLossPrice", "stopLossType", "takeProfitPrice", "takeProfitType"]).notEmpty(),
    body("stopLossPrice").isFloat(),
    body("stopLossType").isInt(),
    body("takeProfitPrice").isFloat(),
    body("takeProfitType").isInt(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            spoke,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4CloseOnPrice(
            eoa,
            spoke,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Close On Price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/strategies/collateral-switch:
 *   post:
 *     summary: Subscribe to Aave V4 Collateral Switch strategy
 *     tags:
 *       - AaveV4
 *     description: Subscribes to Aave V4 Collateral Switch strategy.
 *     requestBody:
 *       description: Request body for subscribing to Aave V4 Collateral Switch strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - fromAssetSymbol
 *               - toAssetSymbol
 *               - amountToSwitch
 *               - price
 *               - priceState
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *               eoa:
 *                 type: string
 *                 example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *               spoke:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Aave V4 spoke address. Optional."
 *               fromAssetSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Symbol of the collateral asset to switch from"
 *               toAssetSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Symbol of the collateral asset to switch to"
 *               amountToSwitch:
 *                 type: number
 *                 example: 1.5
 *                 description: "Amount of collateral to switch (ignored if isMaxUintSwitch is true)"
 *               isMaxUintSwitch:
 *                 type: boolean
 *                 example: false
 *                 description: "If true, use MaxUint256 instead of amountToSwitch"
 *               price:
 *                 type: number
 *                 example: 2000
 *                 description: "Trigger price"
 *               priceState:
 *                 type: string
 *                 example: "under"
 *                 description: "Price state ('under' or 'over')"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                 strategySub:
 *                   type: object
 *       '400':
 *         description: Bad request - validation errors
 *       '500':
 *         description: Internal server error
 */
router.post("/collateral-switch",
    body(["vnetUrl", "eoa", "fromAssetSymbol", "toAssetSymbol", "amountToSwitch", "price", "priceState"]).notEmpty(),
    body("price").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            spoke,
            fromAssetSymbol,
            toAssetSymbol,
            amountToSwitch,
            isMaxUintSwitch,
            price,
            priceState
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subAaveV4CollateralSwitch(
            eoa,
            spoke,
            fromAssetSymbol,
            toAssetSymbol,
            amountToSwitch,
            isMaxUintSwitch || false,
            price,
            priceState,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V4 Collateral Switch strategy with error: ${err.toString()}` });
            });
    });

module.exports = router;
