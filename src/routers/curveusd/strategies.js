/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { subCurveUsdRepayBundle, subCurveUsdBoostBundle, subCurveUsdPaybackStrategy } = require("../../helpers/curveusd/strategies");

const router = express.Router();


/**
 * @swagger
 * /curveusd/strategies/repay:
 *   post:
 *     summary: Subscribe to a CurveUsd Repay strategy
 *     tags:
 *      - CurveUsd
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
 *               - controller
 *               - minRatio
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *                description: "CurveUSD controller address"
 *              minRatio:
 *                type: number
 *                example: 250
 *                description: "Ratio under which the strategy will trigger"
 *              targetRatio:
 *                type: number
 *                example: 300
 *                description: "Target ratio to achieve after strategy execution"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided. Optional, defaults to safe"
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
 *                  example: [    26,    true,    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000a688906bd8b0000000000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000000"    ],    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f","0x0000000000000000000000000000000000000000000000000000000000000004","0x0000000000000000000000000000000000000000000000000000000000000000"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/repay",
    body(["vnetUrl", "eoa", "controller", "minRatio", "targetRatio"]).notEmpty(),
    body(["minRatio", "targetRatio"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, eoa, controller, minRatio, targetRatio, smartWallet } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCurveUsdRepayBundle(
                eoa,
                controller,
                minRatio,
                targetRatio,
                smartWallet || getSmartWallet(req),
                defaultsToSafe(req)
            );

            res.status(200).send(sub);
        } catch (err) {
            res.status(500).send({ error: `Failed to subscribe to CurveUSD Repay strategy with error : ${err.toString()}` });
        }
    });


/**
 * @swagger
 * /curveusd/strategies/boost:
 *   post:
 *     summary: Subscribe to a CurveUsd Repay strategy
 *     tags:
 *      - CurveUsd
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
 *               - controller
 *               - maxRatio
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *                description: "CurveUSD controller address"
 *              maxRatio:
 *                type: number
 *                example: 350
 *                description: "Ratio over which the strategy will trigger"
 *              targetRatio:
 *                type: number
 *                example: 300
 *                description: "Target ratio to achieve after strategy execution"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided. Optional, defaults to safe"
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
 *                  example: [    26,    true,    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000a688906bd8b0000000000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000000"    ],    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f","0x0000000000000000000000000000000000000000000000000000000000000004","0x0000000000000000000000000000000000000000000000000000000000000000"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/boost",
    body(["vnetUrl", "eoa", "controller", "maxRatio", "targetRatio"]).notEmpty(),
    body(["maxRatio", "targetRatio"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, eoa, controller, maxRatio, targetRatio, smartWallet } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCurveUsdBoostBundle(
                eoa,
                controller,
                maxRatio,
                targetRatio,
                smartWallet || getSmartWallet(req),
                defaultsToSafe(req)
            );

            res.status(200).send(sub);
        } catch (err) {
            res.status(500).send({ error: `Failed to subscribe to CurveUSD Boost strategy with error : ${err.toString()}` });
        }
    });

/**
 * @swagger
 * /curveusd/strategies/payback:
 *   post:
 *     summary: Subscribe to a CurveUsd Payback strategy
 *     tags:
 *      - CurveUsd
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
 *               - addressToPullTokensFrom
 *               - positionOwner
 *               - controller
 *               - minHealthRatio
 *               - amountToPayback
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "The EOA which will be sending transactions"
 *              addressToPullTokensFrom:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "Address to pull crvUSD tokens from"
 *              positionOwner:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Address which holds CurveUSD position. Zero address defaults to wallet"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *                description: "CurveUSD controller address"
 *              minHealthRatio:
 *                type: number
 *                example: 15
 *                description: "Below this ratio strategy will trigger"
 *              amountToPayback:
 *                type: number
 *                example: 20000
 *                description: "Amount of crvUSD to payback in token units. Supports float numbers (e.g., 20000.5)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided. Optional, defaults to safe"
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
 *                   example: [92, false,["0x0000000000000000000000009a959b9ee2847a66a5a3d43fd1ec38a4f077750300000000000000000000000006204eb6f318d05260b5cfa46752258ad779eccc000000000000000000000000f939e0a03fb07f59a73314e73794be0e57ac1b4e00000000000000000000000000000000000000000000043c33c19375648000000000000000000000000000000000000000000000000000000000000000000000","0x00000000000000000000000006204eb6f318d05260b5cfa46752258ad779eccc000000000000000000000000a920de414ea4ab66b97da1bfe9e6eca7d42196350000000000000000000000000000000000000000000000000214e8348c4f0000"],["0x000000000000000000000000a920de414ea4ab66b97da1bfe9e6eca7d4219635","0x000000000000000000000000000000000000000000000000000000000000000f","0x00000000000000000000000000000000000000000000043c33c1937564800000","0x000000000000000000000000f939e0a03fb07f59a73314e73794be0e57ac1b4e"]]
 *                 subId:
 *                   type: string
 *                   example: "948"
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
    body(["vnetUrl", "eoa", "addressToPullTokensFrom", "positionOwner", "controller", "minHealthRatio", "amountToPayback"]).notEmpty(),
    body(["minHealthRatio", "amountToPayback"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, eoa, addressToPullTokensFrom, positionOwner, controller, minHealthRatio, amountToPayback, smartWallet } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const sub = await subCurveUsdPaybackStrategy(
                eoa,
                addressToPullTokensFrom,
                positionOwner,
                controller,
                minHealthRatio,
                amountToPayback,
                smartWallet || getSmartWallet(req),
                defaultsToSafe(req)
            );

            res.status(200).send(sub);
        } catch (err) {
            res.status(500).send({ error: `Failed to subscribe to CurveUSD Payback strategy with error : ${err.toString()}` });
        }
    });

module.exports = router;
