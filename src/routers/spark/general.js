/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, getWalletAddr, defaultsToSafe } = require("../../utils");
const { getLoanData } = require("../../helpers/spark/view");
const { createSparkPosition, sparkSupply, sparkWithdraw, sparkBorrow, sparkPayback } = require("../../helpers/spark/general");

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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
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
router.post("/get-position", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, owner } = req.body;

        await setupVnet(vnetId);

        const pos = await getLoanData(market, owner);

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to fetch position info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/general/create:
 *   post:
 *     summary: Create Spark position on a vnet
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
 *              vnetId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided"
 *              collToken:
 *                type: string
 *                example: "ETH"
 *              debtToken:
 *                type: string
 *                example: "DAI"
 *              rateMode:
 *                type: number
 *                example: 2
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
router.post("/create", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, collToken, debtToken, rateMode, coll, debt, owner } = req.body;

        await setupVnet(vnetId, [owner]);
        const pos = await createSparkPosition(market, collToken, debtToken, rateMode, coll, debt, owner, getWalletAddr(req), defaultsToSafe(req));

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to create spark position info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/general/supply:
 *   post:
 *     summary: Supply collateral to Spark position on a vnet
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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
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
router.post("/supply", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, collToken, amount, owner } = req.body;

        await setupVnet(vnetId, [owner]);
        const pos = await sparkSupply(market, collToken, amount, owner, getWalletAddr(req), defaultsToSafe(req));

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to supply to an Spark position info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/general/withdraw:
 *   post:
 *     summary: Withdraw collateral from Spark position on a vnet
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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
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
router.post("/withdraw", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, collToken, amount, owner } = req.body;

        await setupVnet(vnetId, [owner]);
        const pos = await sparkWithdraw(market, collToken, amount, owner, getWalletAddr(req), defaultsToSafe(req));

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to withdraw from an Spark position info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/general/borrow:
 *   post:
 *     summary: Borrow debt from Spark position on a vnet
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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
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
router.post("/borrow", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, debtToken, rateMode, amount, owner } = req.body;

        await setupVnet(vnetId, [owner]);
        const pos = await sparkBorrow(market, debtToken, rateMode, amount, owner, getWalletAddr(req), defaultsToSafe(req));

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to borrow from an Spark position info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/general/payback:
 *   post:
 *     summary: Borrow debt from Spark position on a vnet
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
 *              vnetId:
 *                type: string
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
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
router.post("/payback", async (req, res) => {
    let resObj;

    try {
        const { vnetId, market, debtToken, rateMode, amount, owner } = req.body;

        await setupVnet(vnetId, [owner]);
        const pos = await sparkPayback(market, debtToken, rateMode, amount, owner, getWalletAddr(req), defaultsToSafe(req));

        res.status(200).send(pos);
    } catch (err) {
        resObj = { error: `Failed to payback an Spark info with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
