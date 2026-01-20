/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { subMcdCloseToDaiStrategy, subMcdCloseToCollStrategy, subMCDSmartSavingsRepayStrategy, subMcdAutomationStrategy } = require("../../helpers/maker/strategies");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /maker/strategies/close-to-dai:
 *   post:
 *     summary: Subscribe to MCD Close to DAI strategy
 *     tags:
 *      - Maker
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
 *               - vaultId
 *               - triggerPrice
 *               - triggerState
 *               - eoa
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              triggerPrice:
 *                type: integer
 *                example: 1500
 *              triggerState:
 *                type: string
 *                example: "UNDER"
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
 *                  example: [    7,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
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
router.post("/close-to-dai",
    body(["vnetUrl", "vaultId", "triggerPrice", "triggerState", "eoa"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, triggerPrice, triggerState } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subMcdCloseToDaiStrategy(vaultId, triggerPrice, triggerState, eoa, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to MCD close to DAI strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /maker/strategies/close-to-coll:
 *   post:
 *     summary: Subscribe to a MCD Close to Coll strategy
 *     tags:
 *      - Maker
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
 *               - vaultId
 *               - triggerPrice
 *               - triggerState
 *               - eoa
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              triggerPrice:
 *                type: integer
 *                example: 1500
 *              triggerState:
 *                type: string
 *                example: "UNDER"
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
router.post("/close-to-coll",
    body(["vnetUrl", "vaultId", "triggerPrice", "triggerState", "eoa"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, triggerPrice, triggerState } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subMcdCloseToCollStrategy(vaultId, triggerPrice, triggerState, eoa, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to MCD close to coll strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /maker/strategies/smart-savings-repay:
 *   post:
 *     summary: Subscribe to a MCD Repay from smart savings bundle
 *     tags:
 *      - Maker
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
 *               - vaultId
 *               - protocol
 *               - minRatio
 *               - targetRatio
 *               - eoa
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              protocol:
 *                type: string
 *                example: "rari"
 *              minRatio:
 *                type: number
 *                example: 200
 *              targetRatio:
 *                type: number
 *                example: 220
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
 *                  example: [    2,    true,    [      "0x00000000000000000000000000000000000000000000000000000000000074190000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000000000000000000000000000001e87f85809dc0000",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
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
router.post("/smart-savings-repay",
    body(["vnetUrl", "vaultId", "protocol", "minRatio", "targetRatio", "eoa"]).notEmpty(),
    body(["minRatio", "targetRatio"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, protocol, minRatio, targetRatio } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subMCDSmartSavingsRepayStrategy(vaultId, protocol, minRatio, targetRatio, eoa, getSmartWallet(req), defaultsToSafe(req))
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to MCD smart savings repay strategy with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /maker/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a MCD Automation strategy
 *     tags:
 *      - Maker
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
 *               - vaultId
 *               - eoa
 *               - minRatio
 *               - maxRatio
 *               - targetRepayRatio
 *               - targetBoostRatio
 *               - boostEnabled
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              minRatio:
 *                type: number
 *                example: 200
 *              maxRatio:
 *                type: number
 *                example: 300
 *              targetRepayRatio:
 *                type: number
 *                example: 220
 *              targetBoostRatio:
 *                type: number
 *                example: 250
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
 *                  example: {  "subId": "561",
 *                              "strategySub": [
 *                              31048,
 *                              "1500000000000000000",
 *                              "2000000000000000000",
 *                              "1800000000000000000",
 *                              "1800000000000000000",
 *                              true
 *                             ]}
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
router.post("/dfs-automation",
    body(["vnetUrl", "vaultId", "eoa", "minRatio", "maxRatio", "targetRepayRatio", "targetBoostRatio", "boostEnabled"]).notEmpty(),
    body(["minRatio", "maxRatio", "targetRepayRatio", "targetBoostRatio"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, vaultId, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return subMcdAutomationStrategy(
            vaultId, eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to MCD automation strategy with error : ${err.toString()}` });
            });
    });


module.exports = router;
