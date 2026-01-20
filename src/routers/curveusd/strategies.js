/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getWalletAddr, defaultsToSafe } = require("../../utils");
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *              minRatio:
 *                  type: integer
 *                  example: 250
 *              targetRatio:
 *                  type: integer
 *                  example: 300
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
router.post("/repay", body(
    [
        "vnetUrl",
        "owner",
        "controller",
        "minRatio",
        "targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { vnetUrl, owner, controller, minRatio, targetRatio } = req.body;

    await setupVnet(vnetUrl, [owner]);
    subCurveUsdRepayBundle(
        owner, controller, minRatio, targetRatio, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to CurveUsd Repay strategy with error : ${err.toString()}` });
    });
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *              maxRatio:
 *                  type: integer
 *                  example: 350
 *              targetRatio:
 *                  type: integer
 *                  example: 300
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
router.post("/boost", body(
    [
        "vnetUrl",
        "owner",
        "controller",
        "maxRatio",
        "targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { vnetUrl, owner, controller, maxRatio, targetRatio } = req.body;

    await setupVnet(vnetUrl, [owner]);
    subCurveUsdBoostBundle(
        owner, controller, maxRatio, targetRatio, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to CurveUsd Boost strategy with error : ${err.toString()}` });
    });
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              addressToPullTokensFrom:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              positionOwner:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Zero address defaults to wallet"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *              minHealthRatio:
 *                type: integer
 *                example: 15
 *              amountToPayback:
 *                type: integer
 *                example: 20000
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
router.post("/payback", body(
    [
        "vnetUrl",
        "owner",
        "addressToPullTokensFrom",
        "positionOwner",
        "controller",
        "minHealthRatio",
        "amountToPayback"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { vnetUrl, owner, addressToPullTokensFrom, positionOwner, controller, minHealthRatio, amountToPayback } = req.body;

    await setupVnet(vnetUrl, [owner]);
    subCurveUsdPaybackStrategy(
        owner, addressToPullTokensFrom, positionOwner, controller, minHealthRatio, amountToPayback, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to CurveUsd Payback strategy with error : ${err.toString()}` });
    });
});

module.exports = router;
