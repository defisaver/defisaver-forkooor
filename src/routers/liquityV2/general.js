/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe, getSender } = require("../../utils");
const { getTroveInfo } = require("../../helpers/liquityV2/view");
const { openTroveV2 } = require("../../helpers/liquityV2/general");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /liquity/v2/general/get-trove:
 *   post:
 *     summary: Fetch info about liquityV2 trove on a vnet
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
 *             required:
 *               - vnetUrl
 *               - market
 *               - troveId
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "WETH"
 *                description: "Market symbol (e.g., WETH, wstETH, rETH)"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *                description: "Id of the trove"
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
    body(["vnetUrl", "market", "troveId"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, market, troveId } = req.body;

        await setupVnet(vnetUrl, []);
        return getTroveInfo(market, troveId)
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to fetch trove info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/general/open-trove/eoa:
 *   post:
 *     summary: Open a liquityV2 trove on a vnet for an EOA
 *     tags:
 *       - LiquityV2
 *     description: Open a new trove for Liquity V2 owned directly by an EOA
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
 *               - troveOwnerIndex
 *               - market
 *               - collAmount
 *               - debtAmount
 *               - interestRate
 *               - interestBatchManager
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *               eoa:
 *                 type: string
 *                 example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 description: "The EOA which will own the trove and send transactions"
 *               troveOwnerIndex:
 *                 type: integer
 *                 example: 0
 *                 description: "Index used for troveOwner. This allows multiple troves to be opened by the same address"
 *               market:
 *                 type: string
 *                 example: "WETH"
 *                 description: "On which market to open the trove (e.g., WETH, wstETH, rETH)"
 *               collAmount:
 *                 type: number
 *                 example: 10
 *                 description: "Amount of collateral to deposit in token units (e.g., 10 for 10 WETH, 1.5 for 1.5 WETH). Not USD value. Supports decimals."
 *               debtAmount:
 *                 type: number
 *                 example: 10000
 *                 description: "Amount of BOLD to borrow in token units (e.g., 10000 for 10000 BOLD, 5000.25 for 5000.25 BOLD). Not USD value. Supports decimals."
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
router.post("/open-trove/eoa",
    body([
        "vnetUrl", "eoa", "troveOwnerIndex", "market", "collAmount", "debtAmount", "interestRate", "interestBatchManager"
    ]).notEmpty(),
    body(["collAmount", "debtAmount"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            troveOwnerIndex,
            market,
            collAmount,
            debtAmount,
            interestRate,
            interestBatchManager
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        return openTroveV2(
            eoa,
            eoa,
            troveOwnerIndex,
            market,
            collAmount,
            debtAmount,
            interestRate,
            interestBatchManager
        )
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to open trove with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /liquity/v2/general/open-trove/smart-wallet:
 *   post:
 *     summary: Open a liquityV2 trove on a vnet for a Smart Wallet
 *     tags:
 *       - LiquityV2
 *     description: Open a new trove for Liquity V2 owned by a Smart Wallet (proxy)
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
 *               - troveOwnerIndex
 *               - market
 *               - collAmount
 *               - debtAmount
 *               - interestRate
 *               - interestBatchManager
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *               eoa:
 *                 type: string
 *                 example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *                 description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *               troveOwnerIndex:
 *                 type: integer
 *                 example: 0
 *                 description: "Index used for troveOwner. This allows multiple troves to be opened by the same address"
 *               market:
 *                 type: string
 *                 example: "WETH"
 *                 description: "On which market to open the trove (e.g., WETH, wstETH, rETH)"
 *               collAmount:
 *                 type: number
 *                 example: 10
 *                 description: "Amount of collateral to deposit in token units (e.g., 10 for 10 WETH, 1.5 for 1.5 WETH). Not USD value. Supports decimals."
 *               debtAmount:
 *                 type: number
 *                 example: 10000
 *                 description: "Amount of BOLD to borrow in token units (e.g., 10000 for 10000 BOLD, 5000.25 for 5000.25 BOLD). Not USD value. Supports decimals."
 *               interestRate:
 *                 type: string
 *                 example: "5.5"
 *                 description: "Which interest rate to use for the trove. If the trove is part of a batch, this will be ignored"
 *               interestBatchManager:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Address of the interest batch manager if this trove should be part of a batch. Defaults to address zero"
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
 *                 description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/open-trove/smart-wallet",
    body([
        "vnetUrl", "eoa", "troveOwnerIndex", "market", "collAmount", "debtAmount", "interestRate", "interestBatchManager"
    ]).notEmpty(),
    body(["collAmount", "debtAmount"]).isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            troveOwnerIndex,
            market,
            collAmount,
            debtAmount,
            interestRate,
            interestBatchManager
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        // Get or create proxy for Smart Wallet route
        const [, proxy] = await getSender(eoa, getSmartWallet(req), defaultsToSafe(req));

        return openTroveV2(
            eoa,
            proxy.address,
            troveOwnerIndex,
            market,
            collAmount,
            debtAmount,
            interestRate,
            interestBatchManager
        )
            .then(troveInfo => {
                res.status(200).send(troveInfo);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to open trove with error : ${err.toString()}` });
            });
    });

module.exports = router;
