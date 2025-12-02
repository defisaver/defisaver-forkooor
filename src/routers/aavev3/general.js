/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const hre = require("hardhat");
const express = require("express");
const { setupFork, defaultsToSafe, getWalletAddr } = require("../../utils");
const { getLoanData, getSafetyRatio } = require("../../helpers/aavev3/view");
const {
    aaveV3Supply,
    aaveV3Withdraw,
    aaveV3Borrow,
    aaveV3Payback,
    createAaveV3Position
} = require("../../helpers/aavev3/general");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /aave/v3/general/get-position:
 *   post:
 *     summary: Fetch info about AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
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
    body(["vnetId", "market", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetId, market, owner } = req.body;

        setupFork(vnetId, [owner]);

        getLoanData(market, owner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/general/get-safety-ratio:
 *   post:
 *     summary: Fetch safety ratio for user's AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
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
 *                 ratio:
 *                   type: string
 *                   example: "1214255397822228163"
 *                   description: "Ratio of the user's assets to liabilities"
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
router.post("/get-safety-ratio",
    body(["vnetId", "market", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetId, market, owner } = req.body;

        setupFork(vnetId, [owner]);

        getSafetyRatio(market, owner)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch safety ratio info with error : ${err.toString()}` });
            });
    });


/**
 * @swagger
 * /aave/v3/general/create:
 *   post:
 *     summary: Create AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              useDefaultMarket:
 *                type: boolean
 *                example: true
 *                description: "If true, the default market will be used, ignoring the value of market parameter"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                description: "The the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided"
 *              collToken:
 *                type: string
 *                example: "ETH"
 *              debtToken:
 *                type: string
 *                example: "DAI"
 *              rateMode:
 *                type: number
 *                description: "2 For variable rate and 1 for stable rate"
 *                example: 2
 *              collAmount:
 *                type: number
 *                example: 2
 *              debtAmount:
 *                type: number
 *                example: 2000
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              isEOA:
 *                type: boolean
 *                example: true
 *                description: "Whether to create an EOA or SW position"
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
router.post("/create",
    body(["vnetId", "useDefaultMarket", "market", "collToken", "debtToken", "rateMode", "collAmount", "debtAmount", "owner", "isEOA"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetId, useDefaultMarket, market, collToken, debtToken, rateMode, collAmount, debtAmount = 0, owner, isEOA } = req.body;

        await setupFork(vnetId, [owner]);

        createAaveV3Position(
            useDefaultMarket, market, collToken, debtToken, rateMode, collAmount, debtAmount, owner, getWalletAddr(req), isEOA, defaultsToSafe(req)
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
 * /aave/v3/general/supply:
 *   post:
 *     summary: Supply collateral to AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              collToken:
 *                type: string
 *                example: "ETH"
 *              amount:
 *                type: number
 *                example: 2
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
router.post("/supply",
    body(["vnetId", "market", "collToken", "amount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetId, market, collToken, amount, owner } = req.body;

        await setupFork(vnetId, [owner]);

        aaveV3Supply(market, collToken, amount, owner, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to supply to an AaveV3 position info with error : ${err.toString()}` });
            });

    });

/**
 * @swagger
 * /aave/v3/general/withdraw:
 *   post:
 *     summary: Withdraw collateral from AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              collToken:
 *                type: string
 *                example: "ETH"
 *              amount:
 *                type: number
 *                example: 2
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
router.post("/withdraw",
    body(["vnetId", "market", "collToken", "amount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetId, market, collToken, amount, owner } = req.body;

        await setupFork(vnetId, [owner]);

        aaveV3Withdraw(market, collToken, amount, owner, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to withdraw from an AaveV3 position info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/general/borrow:
 *   post:
 *     summary: Borrow debt from AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              debtToken:
 *                type: string
 *                example: "DAI"
 *              rateMode:
 *                type: number
 *                example: 2
 *              amount:
 *                type: number
 *                example: 2000
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
router.post("/borrow",
    body(["vnetId", "market", "debtToken", "rateMode", "amount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { vnetId, market, debtToken, rateMode, amount, owner } = req.body;

        await setupFork(vnetId, [owner]);
        aaveV3Borrow(market, debtToken, rateMode, amount, owner, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to borrow from an AaveV3 position info with error : ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/general/payback:
 *   post:
 *     summary: Borrow debt from AaveV3 position on a fork
 *     tags:
 *      - AaveV3
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
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              debtToken:
 *                type: string
 *                example: "DAI"
 *              rateMode:
 *                type: number
 *                example: 2
 *              amount:
 *                type: number
 *                example: 2000
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
router.post("/payback",
    body(["vnetId", "market", "debtToken", "rateMode", "amount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetId, market, debtToken, rateMode, amount, owner } = req.body;

        await setupFork(vnetId, [owner]);
        aaveV3Payback(market, debtToken, rateMode, amount, owner, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to payback an AaveV3 position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
