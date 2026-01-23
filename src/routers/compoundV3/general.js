/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable consistent-return */
const express = require("express");
const { setupVnet, getSmartWallet, defaultsToSafe } = require("../../utils");
const { getLoanData, COMP_V3_MARKETS } = require("../../helpers/compoundV3/view");
const {
    createCompoundV3Position,
    createCompoundV3EOAPosition,
    addManager
} = require("../../helpers/compoundV3/general");
const { body, validationResult } = require("express-validator");
const hre = require("hardhat");

const router = express.Router();

/**
 * @swagger
 * /compound/v3/general/get-position:
 *   post:
 *     summary: Fetch info about CompoundV3 position on a vnet
 *     tags:
 *      - CompoundV3
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
 *               - marketSymbol
 *               - positionOwner
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH)"
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                    - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                    - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 depositAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit amount"
 *                 depositValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit value"
 *                 borrowAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow amount"
 *                 borrowValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow value"
 *                 collValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "coll value"
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
    body(["vnetUrl", "marketSymbol", "positionOwner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, marketSymbol, positionOwner } = req.body;

            await setupVnet(vnetUrl, [positionOwner]);

            const { chainId } = await hre.ethers.provider.getNetwork();
            const resolvedMarketSymbol = marketSymbol === "ETH" ? "WETH" : marketSymbol;

            if (!COMP_V3_MARKETS[chainId]) {
                throw new Error(`Chain ${chainId} is not supported`);
            }

            const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol];

            if (!market) {
                throw new Error(`Market not found for symbol ${marketSymbol} on chain ${chainId}`);
            }

            const pos = await getLoanData(market, positionOwner);

            res.status(200).send(pos);
        } catch (err) {
            res.status(500).send({ error: `Failed to fetch CompoundV3 position info with error : ${err.toString()}` });
        }
    });


/**
 * @swagger
 * /compound/v3/general/create/smart-wallet:
 *   post:
 *     summary: Create CompoundV3 Smart Wallet position on a vnet
 *     tags:
 *      - CompoundV3
 *     description: Creates a CompoundV3 position for a Smart Wallet (Safe)
 *     requestBody:
 *       description: Request body for creating a CompoundV3 Smart Wallet position
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
 *               - debtSymbol
 *               - borrowAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH). Optional - if not provided, will derive from debtSymbol"
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 3
 *                description: "Amount of collateral to supply in token units (e.g., 3 for 3 WETH). Supports float numbers (e.g., 3.5)"
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              borrowAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount to borrow in token units (e.g., 2000 for 2000 USDC). Supports float numbers (e.g., 2000.25)"
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                    - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                    - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 depositAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit amount"
 *                 depositValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit value"
 *                 borrowAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow amount"
 *                 borrowValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow value"
 *                 collValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "coll value"
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
    body(["vnetUrl", "eoa", "collSymbol", "collAmount", "debtSymbol", "borrowAmount"]).notEmpty(),
    body(["collAmount", "borrowAmount"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, eoa, marketSymbol, collSymbol, collAmount, debtSymbol, borrowAmount, smartWallet } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const pos = await createCompoundV3Position(
                marketSymbol || null,
                collSymbol,
                collAmount,
                debtSymbol,
                borrowAmount,
                eoa,
                smartWallet || getSmartWallet(req),
                defaultsToSafe(req)
            );

            res.status(200).send(pos);
        } catch (err) {
            res.status(500).send({ error: `Failed to create CompoundV3 position with error : ${err.toString()}` });
        }
    });


/**
 * @swagger
 * /compound/v3/general/create/eoa:
 *   post:
 *     summary: Create CompoundV3 EOA position on a vnet
 *     tags:
 *      - CompoundV3
 *     description: Creates a CompoundV3 position for an EOA (Externally Owned Account)
 *     requestBody:
 *       description: Request body for creating a CompoundV3 EOA position
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
 *               - debtSymbol
 *               - borrowAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the position"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH). Optional - if not provided, will derive from debtSymbol"
 *              collSymbol:
 *                type: string
 *                example: "WETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 3
 *                description: "Amount of collateral to supply in token units (e.g., 3 for 3 WETH). Supports float numbers (e.g., 3.5)"
 *              debtSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              borrowAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount to borrow in token units (e.g., 2000 for 2000 USDC). Supports float numbers (e.g., 2000.25)"
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
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                    - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                    - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 depositAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit amount"
 *                 depositValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit value"
 *                 borrowAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow amount"
 *                 borrowValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow value"
 *                 collValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "coll value"
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
router.post("/create/eoa",
    body(["vnetUrl", "eoa", "collSymbol", "collAmount", "debtSymbol", "borrowAmount"]).notEmpty(),
    body(["collAmount", "borrowAmount"]).isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, eoa, marketSymbol, collSymbol, collAmount, debtSymbol, borrowAmount } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const pos = await createCompoundV3EOAPosition(
                marketSymbol || null,
                collSymbol,
                collAmount,
                debtSymbol,
                borrowAmount,
                eoa
            );

            res.status(200).send(pos);
        } catch (err) {
            res.status(500).send({ error: `Failed to create CompoundV3 EOA position with error : ${err.toString()}` });
        }
    });

/**
 * @swagger
 * /compound/v3/general/add-manager:
 *   post:
 *     summary: Add a manager that can manage a Compound V3 position for an EOA
 *     tags:
 *      - CompoundV3
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
 *               - marketSymbol
 *               - eoa
 *               - manager
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *                description: "Unique identifier for the vnet"
 *              marketSymbol:
 *                type: string
 *                example: "USDC"
 *                description: "Symbol of the CompoundV3 market (e.g., USDC, USDT, WETH)"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and allowing the manager to manage the position"
 *              manager:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                description: "The address of the manager to add"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eoa:
 *                   type: string
 *                   example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                   description: "The EOA address that authorized the manager"
 *                 manager:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "The manager address that was authorized"
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
router.post("/add-manager",
    body(["vnetUrl", "marketSymbol", "eoa", "manager"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, marketSymbol, eoa, manager } = req.body;

            await setupVnet(vnetUrl, [eoa]);

            const result = await addManager(marketSymbol, eoa, manager);

            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ error: `Failed to add manager with error : ${err.toString()}` });
        }
    });

module.exports = router;
