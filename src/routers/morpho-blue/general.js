/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork, getWalletAddr, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { getUserData } = require("../../helpers/morpho-blue/view");
const { createMorphoBluePosition } = require("../../helpers/morpho-blue/general");

const router = express.Router();


/**
 * @swagger
 * /morpho-blue/general/create:
 *   post:
 *     summary: Create MorphoBlue position on a fork
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
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/{vnetId}"
 *              loanToken:
 *                type: string
 *                example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *              collateralToken:
 *                type: string
 *                example: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              coll:
 *                type: number
 *                example: 2
 *              debt:
 *                type: number
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
 *                 owner:
 *                   type: string
 *                   example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *                   description: "Owner of position"
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
    body(["vnetId", "loanToken", "collateralToken", "oracle", "irm", "lltv", "owner", "coll", "debt"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetId, loanToken, collateralToken, oracle, irm, lltv, owner, coll, debt } = req.body;

        await setupFork(vnetId, [owner]);
        createMorphoBluePosition({ loanToken, collateralToken, oracle, irm, lltv }, owner, coll, debt, getWalletAddr(req), defaultsToSafe(req))
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
 *     summary: Fetch info about MorphoBlue position on a fork
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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              loanToken:
 *                type: string
 *                example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *              collateralToken:
 *                type: string
 *                example: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              owner:
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
    body(["vnetId", "loanToken", "collateralToken", "oracle", "irm", "lltv", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetId, loanToken, collateralToken, oracle, irm, lltv, owner } = req.body;

        setupFork(vnetId);

        getUserData({ loanToken, collateralToken, oracle, irm, lltv }, owner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
