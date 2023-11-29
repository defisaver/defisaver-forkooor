/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { getTroveInfo } = require("../../helpers/liquity/view");
const { setupFork } = require("../../utils");
const { openTrove, adjustTrove } = require("../../helpers/liquity/general");

const router = express.Router();

/**
 * @swagger
 * /liquity/general/get-trove:
 *   post:
 *     summary: Fetch info about liquity trove on a fork
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
 *              forkId:
 *                type: string
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
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
        const { forkId, sender } = req.body;

        await setupFork(forkId);
        const troveInfo = await getTroveInfo(sender);

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
 *     summary: Open a liquity trove on a fork
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
 *              forkId:
 *                type: string
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *              collAmount:
 *                type: integer
 *                example: 5
 *              debtAmount:
 *                type: integer
 *                example: 4000
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
        const { forkId, sender, collAmount, debtAmount } = req.body;

        await setupFork(forkId);
        const troveInfo = await openTrove({ sender, collAmount, debtAmount });

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
 *     summary: Adjust a liquity trove on a fork
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
 *              forkId:
 *                type: string
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
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
        const { forkId, sender, collAction, collAmount, debtAction, debtAmount } = req.body;

        await setupFork(forkId);
        const troveInfo = await adjustTrove({ sender, collAction, collAmount, debtAction, debtAmount });

        res.status(200).send(troveInfo);
    } catch (err) {
        resObj = { error: `Failed to open trove with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
