/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
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
 *             required:
 *               - vnetUrl
 *               - controller
 *               - eoa
 *               - collAmount
 *               - debtAmount
 *               - numberOfBands
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *                description: "CurveUSD controller address"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided"
 *              collAmount:
 *                type: number
 *                example: 2
 *                description: "Amount of collateral to supply in token units (e.g., 2 for 2 ETH). Supports float numbers (e.g., 2.5)"
 *              debtAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount of crvUSD debt to borrow in token units (e.g., 2000 for 2000 crvUSD). Supports float numbers (e.g., 2000.25)"
 *              numberOfBands:
 *                type: number
 *                example: 10
 *                description: "Number of bands for creating a new CurveUSD position"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "Optional proxy address. If not provided, a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided. Optional, defaults to safe"
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
    body(["vnetUrl", "controller", "eoa", "collAmount", "debtAmount", "numberOfBands"]).notEmpty(),
    body(["collAmount", "debtAmount"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, controller, eoa, collAmount, debtAmount, numberOfBands, smartWallet } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const pos = await createCurveUsdPosition(
                controller,
                collAmount,
                debtAmount,
                eoa,
                numberOfBands,
                smartWallet || getSmartWallet(req),
                defaultsToSafe(req)
            );

            res.status(200).send(pos);
        } catch (err) {
            res.status(500).send({ error: `Failed to create CurveUSD position with error : ${err.toString()}` });
        }
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
 *             required:
 *               - vnetUrl
 *               - controller
 *               - positionOwner
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              controller:
 *                type: string
 *                example: "0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635"
 *                description: "CurveUSD controller address"
 *              positionOwner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                description: "User owning the position. Specify either eoa, if eoa position, or wallet address if position is owned by a wallet"
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
    body(["vnetUrl", "controller", "positionOwner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, controller, positionOwner } = req.body;

            await setupVnet(vnetUrl);

            const pos = await getUserData(controller, positionOwner);

            res.status(200).send(pos);
        } catch (err) {
            res.status(500).send({ error: `Failed to fetch CurveUSD position info with error : ${err.toString()}` });
        }
    });

module.exports = router;
