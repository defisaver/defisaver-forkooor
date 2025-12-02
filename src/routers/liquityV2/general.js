/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork } = require("../../utils");
const { getTroveInfo } = require("../../helpers/liquityV2/view");
const { openTroveV2 } = require("../../helpers/liquityV2/general");
const { body } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /liquity/v2/general/get-trove:
 *   post:
 *     summary: Fetch info about liquityV2 trove on a fork
 *     tags:
 *      - LiquityV2
 *     description: Fetch info about liquityV2 trove
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
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: Id of the trove
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 troveId:
 *                  type: string
 *                  example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                 owner:
 *                  type: string
 *                  example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 collToken:
 *                  type: string
 *                  example: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
 *                 status:
 *                  type: integer
 *                  example: 1
 *                 collAmount:
 *                  type: string
 *                  example: "10000000000000000000"
 *                 debtAmount:
 *                  type: string
 *                  example: "15002876721843529117407"
 *                 collPrice:
 *                  type: string
 *                  example: "2500000000000000000000"
 *                 TCRatio:
 *                  type: string
 *                  example: "1666347092194732145"
 *                 annualInterestRate:
 *                  type: string
 *                  example: "10000000000000000"
 *                 interestBatchManager:
 *                  type: string
 *                  example: "0x0000000000000000000000000000000000000000"
 *                 batchDebtShares:
 *                  type: string
 *                  example: "0"
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
    body(["vnetId", "market", "troveId"]).notEmpty(),
    async (req, res) => {
        let resObj;

        try {
            const { vnetId, market, troveId } = req.body;

            await setupFork(vnetId, []);
            const troveInfo = await getTroveInfo(market, troveId);

            res.status(200).send(troveInfo);
        } catch (err) {
            resObj = { error: `Failed to fetch trove info with error : ${err.toString()}` };
            res.status(500).send(resObj);
        }
    });

/**
 * @swagger
 * /liquity/v2/general/open-trove:
 *   post:
 *     summary: Open a liquityV2 trove on a fork
 *     tags:
 *       - LiquityV2
 *     description: Open a new trove for Liquity V2
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vnetId:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *               sender:
 *                 type: string
 *                 example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 description: "Eoa if eoa will own the trove or proxy owner, if trove will be owned by proxy"
 *               troveOwner:
 *                 type: string
 *                 example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 description: "Eoa if eoa will own the trove or proxy address, if trove will be created on proxy"
 *               troveOwnerIndex:
 *                 type: integer
 *                 example: 0
 *                 description: "Index used for troveOwner. This allows multiple troves to be opened by the same address"
 *               market:
 *                 type: string
 *                 example: "WETH"
 *                 description: "On which market to open the trove"
 *               collAmount:
 *                 type: integer
 *                 example: 10
 *                 description: "Amount of collateral to deposit, in collateral token"
 *               debtAmount:
 *                 type: integer
 *                 example: 10000
 *                 description: "Amount of BOLD to borrow"
 *               interestRate:
 *                 type: string
 *                 example: "5.5"
 *                 description: "Which interest rate to use for the trove. If the trove is part of a batch, this will be ignored"
 *               interestBatchManager:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Address of the interest batch manager if this trove should be part of a batch. Defaults to address zero"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 troveId:
 *                   type: string
 *                   example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                 owner:
 *                   type: string
 *                   example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 collToken:
 *                   type: string
 *                   example: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 collAmount:
 *                   type: string
 *                   example: "10000000000000000000"
 *                 debtAmount:
 *                   type: string
 *                   example: "15002876721843529117407"
 *                 collPrice:
 *                   type: string
 *                   example: "2500000000000000000000"
 *                 TCRatio:
 *                   type: string
 *                   example: "1666347092194732145"
 *                 annualInterestRate:
 *                   type: string
 *                   example: "10000000000000000"
 *                 interestBatchManager:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                 batchDebtShares:
 *                   type: string
 *                   example: "0"
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
    body([
        "vnetId", "sender", "troveOwner", "troveOwnerIndex", "market", "collAmount", "debtAmount", "interestRate", "interestBatchManager"
    ]).notEmpty(),
    async (req, res) => {
        let resObj;

        try {
            const {
                vnetId,
                sender,
                troveOwner,
                troveOwnerIndex,
                market,
                collAmount,
                debtAmount,
                interestRate,
                interestBatchManager
            } = req.body;

            await setupFork(vnetId, []);

            const troveInfo = await openTroveV2(
                sender,
                troveOwner,
                troveOwnerIndex,
                market,
                collAmount,
                debtAmount,
                interestRate,
                interestBatchManager
            );

            res.status(200).send(troveInfo);
        } catch (err) {
            resObj = { error: `Failed to open trove with error : ${err.toString()}` };
            res.status(500).send(resObj);
        }
    });

module.exports = router;
