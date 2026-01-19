/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { getTroveInfo } = require("../../helpers/liquity/view");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { openTrove, adjustTrove } = require("../../helpers/liquity/general");

const router = express.Router();

/**
 * @swagger
 * /liquity/general/get-trove:
 *   post:
 *     summary: Fetch info about liquity trove on a vnet
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "Address of the trove owner"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 troveStatus:
 *                  type: integer
 *                  example: 1
 *                 collAmount:
 *                  type: string
 *                  example: "109124124064641358657986"
 *                 debtAmount:
 *                  type: string
 *                  example: "56288199435463558516520615"
 *                 collPrice:
 *                  type: string
 *                  example: "1703940000000000000000"
 *                 TCRatio:
 *                  type: string
 *                  example: "2360627119588632279"
 *                 borrowingFeeWithDecay:
 *                  type: string
 *                  example: "5225679392036015"
 *                 recoveryMode:
 *                  type: boolean
 *                  example: false
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
router.post("/get-trove",
    body(["vnetUrl", "eoa"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return getTroveInfo(eoa)
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to fetch trove info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/general/open-trove:
 *   post:
 *     summary: Open a liquity trove on a vnet
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
 *               - collAmount
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collAmount:
 *                type: number
 *                example: 5
 *                description: "Amount of collateral to supply in token units (e.g., 5 for 5 ETH, 1.5 for 1.5 ETH). Not USD value. Supports decimals."
 *              debtAmount:
 *                type: number
 *                example: 4000
 *                description: "Amount of debt to borrow in token units (e.g., 4000 for 4000 LUSD, 2000.25 for 2000.25 LUSD). Not USD value. Supports decimals."
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
 *                 troveStatus:
 *                  type: integer
 *                  example: 1
 *                 collAmount:
 *                  type: string
 *                  example: "30912412406464135865"
 *                 debtAmount:
 *                  type: string
 *                  example: "26621772571096524928573"
 *                 collPrice:
 *                  type: string
 *                  example: "1703940000000000000000"
 *                 TCRatio:
 *                  type: string
 *                  example: "2360592170115557100"
 *                 borrowingFeeWithDecay:
 *                  type: string
 *                  example: "5225679392036015"
 *                 recoveryMode:
 *                  type: boolean
 *                  example: false
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
router.post("/open-trove",
    body(["vnetUrl", "eoa", "collAmount", "debtAmount"]).notEmpty(),
    body(["collAmount", "debtAmount"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, collAmount, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return openTrove(eoa, collAmount, debtAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to open trove with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/general/adjust-trove:
 *   post:
 *     summary: Adjust a liquity trove on a vnet
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
 *               - collAction
 *               - collAmount
 *               - debtAction
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              eoa:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collAction:
 *                type: string
 *                example: "withdraw"
 *              collAmount:
 *                type: number
 *                example: 1.5
 *                description: "Amount of collateral to supply/withdraw in token units (e.g., 1.5 for 1.5 ETH, 5 for 5 ETH). Not USD value. Supports decimals."
 *              debtAction:
 *                type: string
 *                example: "payback"
 *              debtAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount of debt to payback/borrow in token units (e.g., 2000 for 2000 LUSD, 1000.25 for 1000.25 LUSD). Not USD value. Supports decimals."
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
 *                 troveStatus:
 *                  type: integer
 *                  example: 1
 *                 collAmount:
 *                  type: string
 *                  example: "2091241240646413586"
 *                 debtAmount:
 *                  type: string
 *                  example: "5628819943546355851652"
 *                 collPrice:
 *                  type: string
 *                  example: "1703940000000000000000"
 *                 TCRatio:
 *                  type: string
 *                  example: "2360627119588632279"
 *                 borrowingFeeWithDecay:
 *                  type: string
 *                  example: "5225679392036015"
 *                 recoveryMode:
 *                  type: boolean
 *                  example: false
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
router.post("/adjust-trove",
    body(["vnetUrl", "eoa", "collAction", "collAmount", "debtAction", "debtAmount"]).notEmpty(),
    body(["collAmount", "debtAmount"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, collAction, collAmount, debtAction, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return adjustTrove(eoa, collAction, collAmount, debtAction, debtAmount, getSmartWallet(req), defaultsToSafe(req))
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to adjust trove with error : ${err.toString()}` });
            });
    });

module.exports = router;
