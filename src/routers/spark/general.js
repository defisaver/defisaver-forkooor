/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const { getLoanData } = require("../../helpers/spark/view");
const { createSparkPosition, sparkSupply, sparkWithdraw, sparkBorrow, sparkPayback } = require("../../helpers/spark/general");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /spark/general/get-position:
 *   post:
 *     summary: Fetch info about Spark position on a vnet
 *     tags:
 *      - Spark
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              positionOwner:
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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

        const { vnetUrl, market, positionOwner } = req.body;

        await setupVnet(vnetUrl, [positionOwner]);

        return getLoanData(market, positionOwner)
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /spark/general/create/smart-wallet:
 *   post:
 *     summary: Create Spark Smart Wallet position on a vnet
 *     tags:
 *      - Spark
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
 *               - eoa
 *               - collSymbol
 *               - debtSymbol
 *               - collAmount
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided"
 *              collSymbol:
 *                type: string
 *                example: "ETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              debtSymbol:
 *                type: string
 *                example: "DAI"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 1.5
 *                description: "Amount of collateral to supply in token units (e.g., 1.5 for 1.5 ETH, 1000 for 1000 DAI). Not USD value. Supports decimals."
 *              debtAmount:
 *                type: number
 *                example: 2000
 *                description: "Amount of debt to borrow in token units (e.g., 2000 for 2000 DAI, 1000 for 1000 USDC). Not USD value. Supports decimals."
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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
    body(["vnetUrl", "collSymbol", "debtSymbol", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    body("debtAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, collSymbol, collAmount, debtSymbol, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        return createSparkPosition(
            market, collSymbol, debtSymbol, collAmount, debtAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
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
 * /spark/general/supply/smart-wallet:
 *   post:
 *     summary: Supply collateral to Spark Smart Wallet position on a vnet
 *     tags:
 *      - Spark
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
 *               - eoa
 *               - collSymbol
 *               - collAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              collSymbol:
 *                type: string
 *                example: "ETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 2
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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
router.post("/supply/smart-wallet",
    body(["vnetUrl", "collSymbol", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, collSymbol, collAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        return sparkSupply(
            market, collSymbol, collAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to supply to position with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /spark/general/withdraw/smart-wallet:
 *   post:
 *     summary: Withdraw collateral from Spark Smart Wallet position on a vnet
 *     tags:
 *      - Spark
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
 *               - eoa
 *               - collSymbol
 *               - collAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              collSymbol:
 *                type: string
 *                example: "ETH"
 *                description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAmount:
 *                type: number
 *                example: 2
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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
router.post("/withdraw/smart-wallet",
    body(["vnetUrl", "collSymbol", "eoa"]).notEmpty(),
    body("collAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, collSymbol, collAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        return sparkWithdraw(
            market, collSymbol, collAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to withdraw from position with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /spark/general/borrow/smart-wallet:
 *   post:
 *     summary: Borrow debt from Spark Smart Wallet position on a vnet
 *     tags:
 *      - Spark
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
 *               - eoa
 *               - debtSymbol
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              debtSymbol:
 *                type: string
 *                example: "DAI"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              debtAmount:
 *                type: number
 *                example: 2000
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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
router.post("/borrow/smart-wallet",
    body(["vnetUrl", "debtSymbol", "eoa"]).notEmpty(),
    body("debtAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, debtSymbol, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        return sparkBorrow(
            market, debtSymbol, debtAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to borrow from position with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /spark/general/payback/smart-wallet:
 *   post:
 *     summary: Payback debt for Spark Smart Wallet position on a vnet
 *     tags:
 *      - Spark
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
 *               - eoa
 *               - debtSymbol
 *               - debtAmount
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              eoa:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *              debtSymbol:
 *                type: string
 *                example: "DAI"
 *                description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              debtAmount:
 *                type: number
 *                example: 2000
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
 *                 eMode:
 *                   type: string
 *                   example: "0"
 *                   description: "Mode of the borrowing operation"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 borrowAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                     - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of addresses where user has borrowed assets from"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 borrowStableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "0"
 *                     - "0"
 *                   description: "Array of stable borrowed amounts corresponding to each borrow address"
 *                 borrowVariableAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "2499936979046"
 *                     - "0"
 *                   description: "Array of variable borrowed amounts corresponding to each borrow address"
 *                 ltv:
 *                   type: integer
 *                   example: 0
 *                   description: "Loan to value ratio"
 *                 liquidationThreshold:
 *                   type: integer
 *                   example: 0
 *                   description: "Threshold at which the assets can be liquidated"
 *                 liquidationBonus:
 *                   type: integer
 *                   example: 0
 *                   description: "Bonus received during liquidation"
 *                 priceSource:
 *                   type: string
 *                   example: "0x0000000000000000000000000000000000000000"
 *                   description: "Source of the price feed"
 *                 label:
 *                   type: string
 *                   example: ""
 *                   description: "Optional label for the response"
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
router.post("/payback/smart-wallet",
    body(["vnetUrl", "debtSymbol", "eoa"]).notEmpty(),
    body("debtAmount").notEmpty().isNumeric(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, debtSymbol, debtAmount } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        return sparkPayback(
            market, debtSymbol, debtAmount, eoa, getSmartWallet(req), defaultsToSafe(req)
        )
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to payback position with error : ${err.toString()}` });
            });
    });

module.exports = router;
