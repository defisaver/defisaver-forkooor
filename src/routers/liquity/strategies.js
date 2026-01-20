/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const {
    subLiquityDebtInFrontRepayStrategy,
    subLiquityLeverageManagementStrategies,
    subLiquityDsrPaybackStrategy,
    subLiquityDsrSupplyStrategy
} = require("../../helpers/liquity/strategies");

const router = express.Router();

/**
 * @swagger
 * /liquity/strategies/dsr-payback:
 *   post:
 *     summary: Subscribe to a Liquity Dsr Payback strategy
 *     tags:
 *      - Liquity
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
 *               - triggerRatio
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *              targetRatio:
 *                type: number
 *                example: 240
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
 *                  example: [    9,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "230"
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
router.post("/dsr-payback",
    body(["vnetUrl", "eoa", "triggerRatio", "targetRatio"]).notEmpty(),
    body(["triggerRatio", "targetRatio"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, triggerRatio, targetRatio } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subLiquityDsrPaybackStrategy(eoa, triggerRatio, targetRatio, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Liquity Dsr Payback strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/strategies/dsr-supply:
 *   post:
 *     summary: Subscribe to a Liquity Dsr Supply strategy
 *     tags:
 *      - Liquity
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
 *               - triggerRatio
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *              targetRatio:
 *                type: number
 *                example: 240
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
 *                  example: [    9,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "230"
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
router.post("/dsr-supply",
    body(["vnetUrl", "eoa", "triggerRatio", "targetRatio"]).notEmpty(),
    body(["triggerRatio", "targetRatio"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, triggerRatio, targetRatio } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subLiquityDsrSupplyStrategy(eoa, triggerRatio, targetRatio, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Liquity Dsr Supply strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/strategies/debt-in-front-repay:
 *   post:
 *     summary: Subscribe to a Liquity Debt In Front strategy
 *     tags:
 *      - Liquity
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
 *               - debtInFront
 *               - targetRatioIncrease
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              debtInFront:
 *                type: number
 *                example: 2000000
 *              targetRatioIncrease:
 *                type: number
 *                example: 20
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
 *                  example: [    9,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "230"
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
router.post("/debt-in-front-repay",
    body(["vnetUrl", "eoa", "debtInFront", "targetRatioIncrease"]).notEmpty(),
    body(["debtInFront", "targetRatioIncrease"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, debtInFront, targetRatioIncrease } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subLiquityDebtInFrontRepayStrategy(eoa, debtInFront, targetRatioIncrease, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Liquity Debt in front repay strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/strategies/leverage-management:
 *   post:
 *     summary: Subscribe to a Liquity Leverage Management strategies
 *     tags:
 *      - Liquity
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
 *               - minRatio
 *               - maxRatio
 *               - targetRatioRepay
 *               - targetRatioBoost
 *               - boostEnabled
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              minRatio:
 *                type: number
 *                example: 220
 *              maxRatio:
 *                type: number
 *                example: 280
 *              targetRatioRepay:
 *                type: number
 *                example: 250
 *              targetRatioBoost:
 *                type: number
 *                example: 260
 *              boostEnabled:
 *                type: boolean
 *                example: true
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
 *                  example: [ "2700000000000000000", "3800000000000000000", "3600000000000000000", "3000000000000000000", false ]
 *                 subId:
 *                  type: string
 *                  example: "230"
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
    body(["vnetUrl", "eoa", "minRatio", "maxRatio", "targetRatioRepay", "targetRatioBoost", "boostEnabled"]).notEmpty(),
    body(["minRatio", "maxRatio", "targetRatioRepay", "targetRatioBoost"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl, eoa, minRatio, maxRatio, targetRatioRepay, targetRatioBoost, boostEnabled
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subLiquityLeverageManagementStrategies(
            eoa, minRatio, maxRatio, targetRatioRepay, targetRatioBoost, boostEnabled, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Liquity Leverage Management strategies with error : ${err.toString()}` });
            });
    });

module.exports = router;
