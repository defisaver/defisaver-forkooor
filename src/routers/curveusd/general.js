/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getWalletAddr, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { createCurveUsdPosition } = require("../../helpers/curveusd/general");
const { getUserData } = require("../../helpers/curveusd/view");

const router = express.Router();

/**
 * @swagger
 * /curveusd/general/create:
 *   post:
 *     summary: Create CurveUsd position on a vnet
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
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              coll:
 *                type: number
 *                example: 2
 *              debt:
 *                type: number
 *                example: 2000
 *              numberOfBands:
 *                type: number
 *                example: 10
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loanExists:
 *                   type: bool
 *                   example: true
 *                   description: "Is position open"
 *                 collateralPrice:
 *                   type: string
 *                   example: "2370136138395399413654"
 *                   description: "Oracle price of collateral"
 *                 marketCollateralAmount:
 *                   type: string
 *                   example: "1000000000000000000"
 *                   description: "Amount of collateral"
 *                 curveUsdCollateralAmount:
 *                   type: string
 *                   example: "0"
 *                   description: "Amount of crvusd collateral"
 *                 N:
 *                   type: string
 *                   example: "10"
 *                   description: "Amount of bands"
 *                 priceLow:
 *                   type: string
 *                   example: "105106748844906801482"
 *                   description: "Price of lowest band"
 *                 priceHigh:
 *                   type: string
 *                   example: "116219407426864257128"
 *                   description: "Price of highest band"
 *                 liquidationDiscount:
 *                   type: string
 *                   example: "60000000000000000"
 *                   description: "Liq discount"
 *                 health:
 *                   type: string
 *                   example: "22578521143775383331"
 *                   description: "Health of the position"
 *                 bandRange:
 *                   type: Object
 *                   description: "highest and lowest bands"
 *                 usersBands:
 *                   type: Object
 *                   description: ""
 *                 collRatio:
 *                   type: string
 *                   example: "23701361383953994137"
 *                   description: "Collateral/debt ratio"
 *                 isInSoftLiquidation:
 *                   type: bool
 *                   example: false
 *                   description: "Is the position in soft liquidation mode"
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
    body(["vnetUrl", "controller", "coll", "debt", "owner", "numberOfBands"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetUrl, controller, owner, coll, debt, numberOfBands } = req.body;

        await setupVnet(vnetUrl, [owner]);
        createCurveUsdPosition(controller, coll, debt, owner, numberOfBands, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create position info with error : ${err.toString()}` });
            });

    });

/**
 * @swagger
 * /curveusd/general/get-position:
 *   post:
 *     summary: Fetch info about CurveUsd position on a vnet
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
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loanExists:
 *                   type: bool
 *                   example: true
 *                   description: "Is position open"
 *                 collateralPrice:
 *                   type: string
 *                   example: "2370136138395399413654"
 *                   description: "Oracle price of collateral"
 *                 marketCollateralAmount:
 *                   type: string
 *                   example: "1000000000000000000"
 *                   description: "Amount of collateral"
 *                 curveUsdCollateralAmount:
 *                   type: string
 *                   example: "0"
 *                   description: "Amount of crvusd collateral"
 *                 N:
 *                   type: string
 *                   example: "10"
 *                   description: "Amount of bands"
 *                 priceLow:
 *                   type: string
 *                   example: "105106748844906801482"
 *                   description: "Price of lowest band"
 *                 priceHigh:
 *                   type: string
 *                   example: "116219407426864257128"
 *                   description: "Price of highest band"
 *                 liquidationDiscount:
 *                   type: string
 *                   example: "60000000000000000"
 *                   description: "Liq discount"
 *                 health:
 *                   type: string
 *                   example: "22578521143775383331"
 *                   description: "Health of the position"
 *                 bandRange:
 *                   type: Object
 *                   description: "highest and lowest bands"
 *                 usersBands:
 *                   type: Object
 *                   description: ""
 *                 collRatio:
 *                   type: string
 *                   example: "23701361383953994137"
 *                   description: "Collateral/debt ratio"
 *                 isInSoftLiquidation:
 *                   type: bool
 *                   example: false
 *                   description: "Is the position in soft liquidation mode"
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
    body(["vnetUrl", "controller", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetUrl, controller, owner } = req.body;

        setupVnet(vnetUrl);

        getUserData(controller, owner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
