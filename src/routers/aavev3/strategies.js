/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork, defaultsToSafe, getWalletAddr } = require("../../utils");
const {
    subAaveV3CloseWithMaximumGasPriceStrategy,
    subAaveAutomationStrategy,
    subAaveCloseToCollStrategy,
    subAaveV3OpenOrderFromCollateral,
    subAaveV3RepayOnPrice,
    subAaveV3GenericAutomationStrategy,
    subAaveV3LeverageManagementOnPriceGeneric,
    subAaveV3CloseOnPriceGeneric,
    subAaveV3CollateralSwitch
} = require("../../helpers/aavev3/strategies");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /aave/v3/strategies/close-with-maximum-gasprice:
 *   post:
 *     summary: Subscribe to a Aave V3 Close With Maximum Gas Price strategy
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
 *              forkId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              strategyOrBundleId:
 *                  type: integer
 *                  example: 24
 *              triggerData:
 *                  type: object
 *                  properties:
 *                     baseTokenAddress:
 *                         type: string
 *                         example: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
 *                     quoteTokenAddress:
 *                         type: string
 *                         example: "0x6b175474e89094c44da98b954eedeac495271d0f"
 *                     price:
 *                         type: integer
 *                         example: 1000000000000000000
 *                     maximumGasPrice:
 *                         type: integer
 *                         example: 100
 *                     ratioState:
 *                         type: integer
 *                         example: 0
 *              subData:
 *                  type: object
 *                  properties:
 *                      collAsset:
 *                          type: string
 *                          example: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
 *                      collAssetId:
 *                          type: integer
 *                          example: 0
 *                      debtAsset:
 *                          type: string
 *                          example: "0x6b175474e89094c44da98b954eedeac495271d0f"
 *                      debtAssetId:
 *                          type: integer
 *                          example: 4
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                  example: [    26,    true,    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000a688906bd8b0000000000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000000"    ],    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f","0x0000000000000000000000000000000000000000000000000000000000000004","0x0000000000000000000000000000000000000000000000000000000000000000"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/close-with-maximum-gasprice", body(
    [
        "forkId",
        "owner",
        "strategyOrBundleId",
        "triggerData.baseTokenAddress",
        "triggerData.quoteTokenAddress",
        "triggerData.price",
        "triggerData.maximumGasPrice",
        "triggerData.ratioState",
        "subData.collAsset",
        "subData.collAssetId",
        "subData.debtAsset",
        "subData.debtAssetId"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, strategyOrBundleId, owner, triggerData, subData } = req.body;

    await setupFork(forkId, [owner], true);
    subAaveV3CloseWithMaximumGasPriceStrategy(
        owner,
        strategyOrBundleId,
        triggerData.baseTokenAddress, triggerData.quoteTokenAddress, triggerData.price, triggerData.ratioState, triggerData.maximumGasPrice,
        subData.collAsset, subData.collAssetId, subData.debtAsset, subData.debtAssetId,
        getWalletAddr(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(201).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Close With Maximum Gas Price Strategy with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/close-with-coll:
 *   post:
 *     summary: Subscribe to a Aave V3 Close With Collateral strategy
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
 *              forkId:
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
 *              triggerData:
 *                  type: object
 *                  properties:
 *                     triggerBaseAssetSymbol:
 *                         type: string
 *                         example: "ETH"
 *                     triggerQuoteAssetSymbol:
 *                         type: string
 *                         example: "DAI"
 *                     price:
 *                         type: integer
 *                         example: 2000
 *                     ratioState:
 *                         type: string
 *                         description: "'OVER' or 'UNDER'"
 *                         example: "OVER"
 *              subData:
 *                  type: object
 *                  properties:
 *                      collAssetSymbol:
 *                          type: string
 *                          example: "ETH"
 *                      debtAssetSymbol:
 *                          type: string
 *                          example: "DAI"
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                  type: Array
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/close-with-coll", body(
    [
        "forkId",
        "useDefaultMarket",
        "market",
        "owner",
        "triggerData.triggerBaseAssetSymbol",
        "triggerData.triggerQuoteAssetSymbol",
        "triggerData.price",
        "triggerData.ratioState",
        "subData.collAssetSymbol",
        "subData.debtAssetSymbol"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, useDefaultMarket, market, owner, triggerData, subData } = req.body;

    await setupFork(forkId, [owner], true);

    subAaveCloseToCollStrategy(
        useDefaultMarket,
        market,
        owner,
        triggerData.triggerBaseAssetSymbol,
        triggerData.triggerQuoteAssetSymbol,
        triggerData.price,
        triggerData.ratioState,
        subData.collAssetSymbol,
        subData.debtAssetSymbol,
        getWalletAddr(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Close Price Strategy with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a Aave Automation strategy
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
 *              forkId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              minRatio:
 *                type: integer
 *                example: 200
 *              maxRatio:
 *                 type: integer
 *                 example: 300
 *              targetRepayRatio:
 *                 type: integer
 *                 example: 220
 *              targetBoostRatio:
 *                 type: integer
 *                 example: 250
 *              boostEnabled:
 *                 type: boolean
 *                 example: true
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
 *                 strategySub:
 *                  type: Array
 *                  example: {  "subId": "561",
 *                              "strategySub": [
 *                              31048,
 *                              "1500000000000000000",
 *                              "2000000000000000000",
 *                              "1800000000000000000",
 *                              "1800000000000000000",
 *                              true
 *                             ]}
 *                 subId:
 *                  type: string
 *                  example: "230"
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
router.post("/dfs-automation", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupFork(forkId, [owner], true);

        const sub = await subAaveAutomationStrategy(
            owner,
            minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled,
            getWalletAddr(req), defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Aave V3 automation strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /aave/v3/strategies/open-order-from-collateral:
 *   post:
 *     summary: Subscribe to a Aave V3 Open Order from collateral strategy
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
 *              forkId:
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
 *              bundleId:
 *                type: integer
 *                example: 36
 *              triggerData:
 *                  type: object
 *                  properties:
 *                     price:
 *                         type: integer
 *                         example: 2000
 *                     ratioState:
 *                         type: string
 *                         description: "'OVER' or 'UNDER'"
 *                         example: "UNDER"
 *              subData:
 *                  type: object
 *                  properties:
 *                      collAssetSymbol:
 *                          type: string
 *                          example: "ETH"
 *                      debtAssetSymbol:
 *                          type: string
 *                          example: "DAI"
 *                      targetRatio:
 *                          type: number
 *                          example: 130
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                   type: Array
 *                   example: [
 *                        36,
 *                        true,
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000002e90edd0000000000000000000000000000000000000000000000000000000000000000001"
 *                        ],
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000",
 *                          "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000004",
 *                          "0x0000000000000000000000002f39d218133afab8f2b819b1066c7e434ad94e9e",
 *                          "0x000000000000000000000000000000000000000000000000120a871cc0020000",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                        ]
 *                   ]
 *                 subId:
 *                   type: string
 *                   example: "427"
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
router.post("/open-order-from-collateral", body(
    [
        "forkId",
        "useDefaultMarket",
        "market",
        "owner",
        "bundleId",
        "triggerData.price",
        "triggerData.ratioState",
        "subData.collAssetSymbol",
        "subData.debtAssetSymbol",
        "subData.targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, useDefaultMarket, market, owner, bundleId, triggerData, subData } = req.body;

    await setupFork(forkId, [owner], true);

    subAaveV3OpenOrderFromCollateral(
        useDefaultMarket,
        market,
        owner,
        bundleId,
        triggerData.price,
        triggerData.ratioState,
        subData.collAssetSymbol,
        subData.debtAssetSymbol,
        subData.targetRatio,
        getWalletAddr(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Open Order from collateral with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/repay-on-price:
 *   post:
 *     summary: Subscribe to a Aave V3 Repay on price strategy
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
 *              forkId:
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
 *              bundleId:
 *                type: integer
 *                example: 36
 *              triggerData:
 *                  type: object
 *                  properties:
 *                     price:
 *                         type: integer
 *                         example: 2000
 *                     ratioState:
 *                         type: string
 *                         description: "'OVER' or 'UNDER'"
 *                         example: "UNDER"
 *              subData:
 *                  type: object
 *                  properties:
 *                      collAssetSymbol:
 *                          type: string
 *                          example: "ETH"
 *                      debtAssetSymbol:
 *                          type: string
 *                          example: "DAI"
 *                      targetRatio:
 *                          type: number
 *                          example: 130
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                   type: Array
 *                   example: [
 *                        36,
 *                        true,
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000002e90edd0000000000000000000000000000000000000000000000000000000000000000001"
 *                        ],
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000",
 *                          "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000004",
 *                          "0x0000000000000000000000002f39d218133afab8f2b819b1066c7e434ad94e9e",
 *                          "0x000000000000000000000000000000000000000000000000120a871cc0020000",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                        ]
 *                   ]
 *                 subId:
 *                   type: string
 *                   example: "427"
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
router.post("/repay-on-price", body(
    [
        "forkId",
        "useDefaultMarket",
        "market",
        "owner",
        "bundleId",
        "triggerData.price",
        "triggerData.ratioState",
        "subData.collAssetSymbol",
        "subData.debtAssetSymbol",
        "subData.targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, useDefaultMarket, market, owner, bundleId, triggerData, subData } = req.body;

    await setupFork(forkId, [owner], true);

    subAaveV3RepayOnPrice(
        useDefaultMarket,
        market,
        owner,
        bundleId,
        triggerData.price,
        triggerData.ratioState,
        subData.collAssetSymbol,
        subData.debtAssetSymbol,
        subData.targetRatio,
        getWalletAddr(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 repay on price strategy with error: ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/leverage-management-generic:
 *   post:
 *     summary: Subscribe to Aave V3 Leverage Management Generic strategy (EOA or Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Leverage Management Generic strategy. Supports both EOA and Smart Wallet strategies.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Leverage Management Generic strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - forkId
 *               - owner
 *               - bundleId
 *               - market
 *               - isEOA
 *               - ratioState
 *               - targetRatio
 *               - triggerRatio
 *               - isGeneric
 *             properties:
 *               forkId:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *                 description: "Unique identifier for the fork"
 *               owner:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               bundleId:
 *                 type: integer
 *                 example: 53
 *                 description: "Bundle ID for the strategy. 52 - Repay on price, 53 - Boost on price"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address"
 *               isEOA:
 *                 type: boolean
 *                 example: true
 *                 description: "If true, creates EOA strategy. If false, creates Smart Wallet strategy"
 *               ratioState:
 *                 type: integer
 *                 example: 0
 *                 description: "If it is boost or repay. 0 for boost, 1 for repay"
 *               targetRatio:
 *                 type: integer
 *                 example: 1800000000000000000
 *                 description: "Target ratio for the strategy"
 *               triggerRatio:
 *                 type: integer
 *                 example: 1900000000000000000
 *                 description: "Trigger ratio for the strategy"
 *               isGeneric:
 *                 type: boolean
 *                 example: true
 *                 description: "If it is new type of subbing that supports EOA strategies"
 *               walletAddr:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               useSafe:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "12345"
 *                   description: "ID of the subscription"
 *                 strategySub:
 *                   type: object
 *                   description: "StrategySub object"
 *       '400':
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to subscribe to Aave V3 Leverage Management Generic strategy with error: ..."
 */
router.post("/leverage-management-generic",
    body(["forkId", "owner", "bundleId", "market", "isEOA", "ratioState", "targetRatio", "triggerRatio", "isGeneric"]).notEmpty(),
    body("isEOA").isBoolean(),
    body("isGeneric").isBoolean(),
    body("bundleId").isInt(),
    body("ratioState").isInt(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { forkId, owner, bundleId, market, isEOA, ratioState, targetRatio, triggerRatio, isGeneric } = req.body;

        await setupFork(forkId, [owner], true);

        subAaveV3GenericAutomationStrategy(
            owner,
            bundleId,
            market,
            isEOA,
            ratioState,
            targetRatio,
            triggerRatio,
            isGeneric,
            getWalletAddr(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Generic Automation strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/leverage-management-on-price-generic:
 *   post:
 *     summary: Subscribe to Aave V3 Leverage Management On Price strategy (EOA or Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Leverage Management On Price strategy. Supports both EOA and Smart Wallet strategies.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Leverage Management On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - forkId
 *               - owner
 *               - bundleId
 *               - market
 *               - isEOA
 *               - collAssetSymbol
 *               - debtAssetSymbol
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *             properties:
 *               forkId:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *                 description: "Unique identifier for the fork"
 *               owner:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               bundleId:
 *                 type: integer
 *                 example: 54
 *                 description: "Bundle ID for the strategy. 54 - Repay on price, 55 - Boost on price"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address"
 *               isEOA:
 *                 type: boolean
 *                 example: true
 *                 description: "If true, creates EOA strategy. If false, creates Smart Wallet strategy"
 *               collAssetSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtAssetSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt asset symbol"
 *               triggerPrice:
 *                 type: number
 *                 example: 0.0005
 *                 description: "Trigger price (supports decimals)"
 *               priceState:
 *                 type: integer
 *                 example: 0
 *                 description: "Price state (0 for under, 1 for over)"
 *               targetRatio:
 *                 type: integer
 *                 example: 1800000000000000000
 *                 description: "Target ratio for the strategy"
 *               proxyAddr:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               useSafe:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "12345"
 *                   description: "ID of the subscription"
 *                 strategySub:
 *                   type: object
 *                   description: "StrategySub object"
 *       '400':
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to subscribe to Aave V3 Leverage Management On Price strategy with error: ..."
 */
router.post("/leverage-management-on-price-generic",
    body(["forkId", "owner", "bundleId", "market", "isEOA", "collAssetSymbol", "debtAssetSymbol", "triggerPrice", "priceState", "targetRatio"]).notEmpty(),
    body("isEOA").isBoolean(),
    body("bundleId").isInt(),
    body("priceState").isInt(),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            forkId,
            owner,
            bundleId,
            market,
            isEOA,
            collAssetSymbol,
            debtAssetSymbol,
            triggerPrice,
            priceState,
            targetRatio
        } = req.body;

        await setupFork(forkId, [owner], true);

        subAaveV3LeverageManagementOnPriceGeneric(
            owner,
            bundleId,
            market,
            isEOA,
            collAssetSymbol,
            debtAssetSymbol,
            triggerPrice,
            priceState,
            targetRatio,
            getWalletAddr(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Leverage Management On Price strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/close-on-price-generic:
 *   post:
 *     summary: Subscribe to Aave V3 Close On Price strategy (EOA or Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Close On Price strategy with stop loss and take profit functionality. Supports both EOA and Smart Wallet strategies.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Close On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - forkId
 *               - owner
 *               - bundleId
 *               - market
 *               - isEOA
 *               - collAssetSymbol
 *               - debtAssetSymbol
 *               - stopLossPrice
 *               - stopLossType
 *               - takeProfitPrice
 *               - takeProfitType
 *             properties:
 *               forkId:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *                 description: "Unique identifier for the fork"
 *               owner:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               bundleId:
 *                 type: integer
 *                 example: 56
 *                 description: "Bundle ID for the strategy. 56 - Close on price"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address"
 *               isEOA:
 *                 type: boolean
 *                 example: true
 *                 description: "If true, creates EOA strategy. If false, creates Smart Wallet strategy"
 *               collAssetSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtAssetSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt asset symbol"
 *               stopLossPrice:
 *                 type: integer
 *                 example: 1800000000000000000
 *                 description: "Stop loss price (0 if not used)"
 *               stopLossType:
 *                 type: integer
 *                 example: 0
 *                 description: "Stop loss type (0 for debt, 1 for collateral)"
 *               takeProfitPrice:
 *                 type: integer
 *                 example: 2200000000000000000
 *                 description: "Take profit price (0 if not used)"
 *               takeProfitType:
 *                 type: integer
 *                 example: 1
 *                 description: "Take profit type (0 for debt, 1 for collateral)"
 *               proxyAddr:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               useSafe:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether to use Safe as smart wallet or dsproxy (default: true)"
 *     responses:
 *       '200':
 *         description: Strategy subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "12345"
 *                   description: "ID of the subscription"
 *                 strategySub:
 *                   type: object
 *                   description: "StrategySub object"
 *       '400':
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to subscribe to Aave V3 Close On Price strategy with error: ..."
 */
router.post("/close-on-price-generic",
    body(["forkId", "owner", "bundleId", "market", "isEOA", "collAssetSymbol", "debtAssetSymbol", "stopLossPrice", "stopLossType", "takeProfitPrice", "takeProfitType"]).notEmpty(),
    body("isEOA").isBoolean(),
    body("bundleId").isInt(),
    body("stopLossPrice").isFloat(),
    body("stopLossType").isFloat(),
    body("takeProfitPrice").isFloat(),
    body("takeProfitType").isFloat(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            forkId,
            owner,
            bundleId,
            market,
            isEOA,
            collAssetSymbol,
            debtAssetSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        } = req.body;

        await setupFork(forkId, [owner], true);

        subAaveV3CloseOnPriceGeneric(
            owner,
            bundleId,
            market,
            isEOA,
            collAssetSymbol,
            debtAssetSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType,
            getWalletAddr(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Close On Price strategy with error: ${err.toString()}` });
            });
    });


/**
 * @swagger
 * /aave/v3/strategies/collateral-switch:
 *   post:
 *     summary: Subscribe to a Aave V3 Collateral Switch strategy
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
 *              forkId:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/{id}"
 *              useDefaultMarket:
 *                type: boolean
 *                example: true
 *                description: "If true, the default market will be used, ignoring the value of market parameter"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              strategyId:
 *                type: integer
 *                example: 135
 *              triggerData:
 *                  type: object
 *                  properties:
 *                     price:
 *                         type: integer
 *                         example: 2000
 *                     ratioState:
 *                         type: string
 *                         description: "'OVER' or 'UNDER'"
 *                         example: "UNDER"
 *              subData:
 *                  type: object
 *                  properties:
 *                      fromAssetSymbol:
 *                          type: string
 *                          example: "WETH"
 *                          description: "Symbol of the collateral asset to switch from"
 *                      toAssetSymbol:
 *                          type: string
 *                          example: "USDC"
 *                          description: "Symbol of the collateral asset to switch to"
 *                      amountToSwitch:
 *                          type: number
 *                          example: 1.5
 *                          description: "Amount of collateral to switch (ignored if isMaxUintSwitch is true)"
 *                      isMaxUintSwitch:
 *                          type: boolean
 *                          example: false
 *                          description: "If true, use MaxUint256 instead of amountToSwitch value"
 *              walletAddr:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if walletAddr is not provided. WalletType field is not mandatory. Defaults to safe"
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subId:
 *                   type: string
 *                   example: "427"
 *                 strategySub:
 *                   type: Array
 *                   example: [
 *                        135,
 *                        false,
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000002e90edd0000000000000000000000000000000000000000000000000000000000000000001"
 *                        ],
 *                        [
 *                          "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000",
 *                          "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000004",
 *                          "0x0000000000000000000000002f39d218133afab8f2b819b1066c7e434ad94e9e",
 *                          "0x00000000000000000000000000000000000000000000000014d1120d7b160000",
 *                          "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                        ]
 *                   ]
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
router.post("/collateral-switch", body(
        [
            "forkId",
            "useDefaultMarket",
            "market",
            "owner",
            "strategyId",
            "triggerData.price",
            "triggerData.ratioState",
            "subData.fromAssetSymbol",
            "subData.toAssetSymbol",
            "subData.amountToSwitch"
        ]
    ).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }
        const { forkId, useDefaultMarket, market, owner, strategyId, triggerData, subData } = req.body;

        await setupFork(forkId, [owner], true);

        subAaveV3CollateralSwitch(
            owner,
            strategyId,
            useDefaultMarket,
            market,
            subData.fromAssetSymbol,
            subData.toAssetSymbol,
            subData.amountToSwitch,
            subData.isMaxUintSwitch || false,
            triggerData.price,
            triggerData.ratioState,
            getWalletAddr(req),
            defaultsToSafe(req)
        ).then(sub => {
            res.status(200).send(sub);
        }).catch(err => {
            res.status(500).send({ error: `Failed to subscribe to Aave V3 collateral switch strategy with error: ${err.toString()}` });
        });
    });

module.exports = router;

