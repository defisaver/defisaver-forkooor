/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet, getTokenInfo } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { getUserData } = require("../../helpers/morpho-blue/view");
const { createMorphoBluePosition } = require("../../helpers/morpho-blue/general");

const router = express.Router();


/**
 * @swagger
 * /morpho-blue/general/create/smart-wallet:
 *   post:
 *     summary: Create MorphoBlue Smart Wallet position on a vnet
 *     tags:
 *      - MorphoBlue
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
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              collSymbol:
 *                type: string
 *                example: "wstETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collAmount:
 *                type: number
 *                example: 2.0
 *                description: "Amount of collateral to supply in token units (supports decimals)"
 *              debtAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount of debt to borrow in token units (supports decimals)"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or DSProxy if smartWallet is not provided. walletType is optional and defaults to safe."
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplyShares:
 *                   type: string
 *                   example: "0"
 *                   description: "Protocol shares for loanToken supplied"
 *                 suppliedInAssets:
 *                   type: string
 *                   example: "0"
 *                   description: "Amount of loanToken supplied in loanToken decimals"
 *                 borrowShares:
 *                   type: string
 *                   example: "1995323841218746"
 *                   description: "Protocol shares for loanToken borrowed"
 *                 borrowedInAssets:
 *                   type: string
 *                   example: "2000000001"
 *                   description: "Amount of loanToken borrowed in loanToken decimals"
 *                 collateral:
 *                   type: string
 *                   example: "2000000000000000000"
 *                   description: "Amount of collateral supplied"
 *                 positionOwner:
 *                   type: string
 *                   example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *                   description: "Position owner address"
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
router.post("/create/smart-wallet",
    body(["vnetUrl", "collSymbol", "debtSymbol", "oracle", "irm", "lltv", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    body("debtAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetUrl, collSymbol, debtSymbol, oracle, irm, lltv, eoa, collAmount, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);
        createMorphoBluePosition(
            { collSymbol, debtSymbol, oracle, irm, lltv },
            collAmount,
            debtAmount,
            eoa,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create position info with error : ${err.toString()}` });
            });

    });

/**
 * @swagger
 * /morpho-blue/general/get-position:
 *   post:
 *     summary: Fetch info about MorphoBlue position on a vnet
 *     tags:
 *      - MorphoBlue
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
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              collSymbol:
 *                type: string
 *                example: "wstETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              positionOwner:
 *                   type: string
 *                   example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *                   description: "Owner of position"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplyShares:
 *                   type: string
 *                   example: "0"
 *                   description: "Protocol shares for loanToken supplied"
 *                 suppliedInAssets:
 *                   type: string
 *                   example: "0"
 *                   description: "Amount of loanToken supplied in loanToken decimals"
 *                 borrowShares:
 *                   type: string
 *                   example: "1995323841218746"
 *                   description: "Protocol shares for loanToken borrowed"
 *                 borrowedInAssets:
 *                   type: string
 *                   example: "2000000001"
 *                   description: "Amount of loanToken borrowed in loanToken decimals"
 *                 collateral:
 *                   type: string
 *                   example: "2000000000000000000"
 *                   description: "Amount of collateral supplied"
 *                 positionOwner:
 *                   type: string
 *                   example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *                   description: "Position owner address"
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
    body(["vnetUrl", "collSymbol", "debtSymbol", "oracle", "irm", "lltv", "positionOwner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetUrl, collSymbol, debtSymbol, oracle, irm, lltv, positionOwner } = req.body;

        await setupVnet(vnetUrl, [positionOwner]);

        const loanToken = (await getTokenInfo(debtSymbol)).address;
        const collateralToken = (await getTokenInfo(collSymbol)).address;

        getUserData({ loanToken, collateralToken, oracle, irm, lltv }, positionOwner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
