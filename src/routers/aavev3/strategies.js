/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork, defaultsToSafeInRequest } = require("../../utils");
const { subAaveV3CloseWithMaximumGasPriceStrategy, subAaveAutomationStrategy, subAaveCloseToCollStrategy } = require("../../helpers/aavev3/strategies");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /aave/v3/strategies/close-with-maximum-gasprice:
 *   post:
 *     summary: Subscribe to a Aave V3 Close With Maximum Gas Price strategy
 *     tags:
 *      - AaveV3
 *      - Strategies
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
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
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
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy. WalletType field is not mandatory. Defaults to safe"
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

    await setupFork(forkId, [owner]);
    subAaveV3CloseWithMaximumGasPriceStrategy(
        owner, strategyOrBundleId,
        triggerData.baseTokenAddress, triggerData.quoteTokenAddress, triggerData.price, triggerData.ratioState, triggerData.maximumGasPrice,
        subData.collAsset, subData.collAssetId, subData.debtAsset, subData.debtAssetId,
        defaultsToSafeInRequest(req)
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
 *      - Strategies
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
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
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
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy. WalletType field is not mandatory. Defaults to safe"
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

    await setupFork(forkId, [owner]);

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
        defaultsToSafeInRequest(req)
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
 *      - Strategies
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
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
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

        await setupFork(forkId, [owner]);

        const sub = await subAaveAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, defaultsToSafeInRequest(req));

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Aave V3 automation strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
