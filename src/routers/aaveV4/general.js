/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const { getLoanData } = require("../../helpers/aaveV4/view");
const { createAaveV4Position } = require("../../helpers/aaveV4/general");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /aave/v4/general/get-position:
 *   post:
 *     summary: Fetch info about AaveV4 position on a vnet
 *     tags:
 *      - AaveV4
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              spoke:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Aave V4 spoke address. Optional - if not provided, the default spoke for the chain will be used."
 *              positionOwner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                description: "User owning the position. Specify the wallet address that owns the position."
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 riskPremium:
 *                   type: string
 *                   example: "0"
 *                   description: "Risk premium of the position"
 *                 avgCollateralFactor:
 *                   type: string
 *                   example: "8000"
 *                   description: "Average collateral factor"
 *                 healthFactor:
 *                   type: string
 *                   example: "1500000000000000000"
 *                   description: "Health factor of the position"
 *                 totalCollateralInUsd:
 *                   type: string
 *                   example: "10000000000"
 *                   description: "Total collateral value in USD"
 *                 totalDebtInUsd:
 *                   type: string
 *                   example: "5000000000"
 *                   description: "Total debt value in USD"
 *                 activeCollateralCount:
 *                   type: string
 *                   example: "1"
 *                   description: "Number of active collateral assets"
 *                 borrowedCount:
 *                   type: string
 *                   example: "1"
 *                   description: "Number of borrowed assets"
 *                 reserves:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: "Array of reserve data for the position"
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
router.post("/get-position",
    body(["vnetUrl", "positionOwner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, spoke, positionOwner } = req.body;

        await setupVnet(vnetUrl, [positionOwner]);

        getLoanData(spoke, positionOwner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v4/general/create:
 *   post:
 *     summary: Create AaveV4 Smart Wallet position on a vnet
 *     tags:
 *      - AaveV4
 *     description: Creates an AaveV4 position for a Smart Wallet (Safe or DSProxy)
 *     requestBody:
 *       description: Request body for creating an AaveV4 Smart Wallet position
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - collSymbol
 *               - collAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              spoke:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Aave V4 spoke address. Optional - if not provided, the default spoke for the chain will be used."
 *              collSymbol:
 *                type: string
 *                example: "ETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 1.5
 *                description: "Amount of collateral to supply in token units (e.g., 1.5 for 1.5 ETH). Not USD value. Supports decimals."
 *              debtSymbol:
 *                type: string
 *                example: "DAI"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH. Required if debtAmount > 0."
 *              debtAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount of debt to borrow in token units. Can be 0 for collateral-only position. Defaults to 0."
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 riskPremium:
 *                   type: string
 *                   example: "0"
 *                   description: "Risk premium of the position"
 *                 avgCollateralFactor:
 *                   type: string
 *                   example: "8000"
 *                   description: "Average collateral factor"
 *                 healthFactor:
 *                   type: string
 *                   example: "1500000000000000000"
 *                   description: "Health factor of the position"
 *                 totalCollateralInUsd:
 *                   type: string
 *                   example: "10000000000"
 *                   description: "Total collateral value in USD"
 *                 totalDebtInUsd:
 *                   type: string
 *                   example: "5000000000"
 *                   description: "Total debt value in USD"
 *                 proxy:
 *                   type: string
 *                   example: "0x1234..."
 *                   description: "Address of the proxy that owns the position"
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
router.post("/create",
    body(["vnetUrl", "collSymbol", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, spoke, collSymbol, collAmount, debtSymbol, debtAmount } = req.body;

        // Default debtAmount to 0 if not provided
        const finalDebtAmount = debtAmount || 0;

        // Default debtSymbol to collSymbol if not provided (only used when debtAmount > 0)
        const finalDebtSymbol = debtSymbol || collSymbol;

        await setupVnet(vnetUrl, [eoa]);

        createAaveV4Position(
            spoke, collSymbol, finalDebtSymbol, collAmount, finalDebtAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create position with error : ${err.toString()}` });
            });
    });

module.exports = router;
