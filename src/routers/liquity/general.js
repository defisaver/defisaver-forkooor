/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { getTroveInfo } = require("../../helpers/liquity/view");
const { setupVnet, getWalletAddr, defaultsToSafe } = require("../../utils");
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              owner:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                description: Address of the trove owner
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
router.post("/get-trove", async (req, res) => {
    let resObj;

    try {
        const { vnetUrl, owner } = req.body;

        await setupVnet(vnetUrl);
        const troveInfo = await getTroveInfo(owner);

        res.status(200).send(troveInfo);
    } catch (err) {
        resObj = { error: `Failed to fetch trove info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *              collAmount:
 *                type: integer
 *                example: 5
 *              debtAmount:
 *                type: integer
 *                example: 4000
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
router.post("/open-trove", async (req, res) => {
    let resObj;

    try {
        const { vnetUrl, sender, collAmount, debtAmount } = req.body;

        const proxyAddr = getWalletAddr(req);
        const useSafe = defaultsToSafe(req);

        await setupVnet(vnetUrl);
        const troveInfo = await openTrove({ sender, collAmount, debtAmount, proxyAddr, useSafe });

        res.status(200).send(troveInfo);
    } catch (err) {
        resObj = { error: `Failed to open trove with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
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
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *              collAction:
 *                type: string
 *                example: "withdraw"
 *              collAmount:
 *                type: integer
 *                example: 1.5
 *              debtAction:
 *                type: string
 *                example: "payback"
 *              debtAmount:
 *                type: integer
 *                example: 2000
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
router.post("/adjust-trove", async (req, res) => {
    let resObj;

    try {
        const { vnetUrl, sender, collAction, collAmount, debtAction, debtAmount } = req.body;

        const proxyAddr = getWalletAddr(req);
        const useSafe = defaultsToSafe(req);

        await setupVnet(vnetUrl);
        const troveInfo = await adjustTrove({ sender, collAction, collAmount, debtAction, debtAmount, proxyAddr, useSafe });

        res.status(200).send(troveInfo);
    } catch (err) {
        resObj = { error: `Failed to open trove with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
