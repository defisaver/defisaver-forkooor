/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const {
    subAaveV3CloseWithMaximumGasPriceStrategy,
    subAaveV3LeverageManagementWithSubProxyStrategy,
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
 * /aave/v3/strategies/close-with-maximum-gasprice/to-collateral:
 *   post:
 *     summary: Subscribe to a Aave V3 Close With Maximum Gas Price strategy (Close to Collateral)
 *     tags:
 *      - AaveV3
 *     description: Subscribes to Aave V3 Close With Maximum Gas Price strategy that closes the position to collateral token
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
 *               - baseTokenSymbol
 *               - quoteTokenSymbol
 *               - price
 *               - maximumGasPrice
 *               - ratioState
 *               - collSymbol
 *               - collAssetId
 *               - debtSymbol
 *               - debtAssetId
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              baseTokenSymbol:
 *                  type: string
 *                  example: "WETH"
 *                  description: "Base token symbol for the trigger (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              quoteTokenSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Quote token symbol for the trigger (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              price:
 *                  type: integer
 *                  example: 1000000000000000000
 *                  description: "Trigger price"
 *              maximumGasPrice:
 *                  type: integer
 *                  example: 100
 *                  description: "Maximum gas price"
 *              ratioState:
 *                  type: integer
 *                  example: 0
 *                  description: "Ratio state"
 *              collSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAssetId:
 *                  type: integer
 *                  example: 0
 *                  description: "Collateral asset ID"
 *              debtSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              debtAssetId:
 *                  type: integer
 *                  example: 4
 *                  description: "Debt asset ID"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/close-with-maximum-gasprice/to-collateral", body(
    [
        "vnetUrl",
        "eoa",
        "baseTokenSymbol",
        "quoteTokenSymbol",
        "price",
        "maximumGasPrice",
        "ratioState",
        "collSymbol",
        "collAssetId",
        "debtSymbol",
        "debtAssetId"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        eoa,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        maximumGasPrice,
        collSymbol,
        collAssetId,
        debtSymbol,
        debtAssetId
    } = req.body;
    const isCloseToColl = true; // Hardcoded for close to collateral route

    await setupVnet(vnetUrl, [eoa]);
    subAaveV3CloseWithMaximumGasPriceStrategy(
        eoa,
        isCloseToColl,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        maximumGasPrice,
        collSymbol,
        collAssetId,
        debtSymbol,
        debtAssetId,
        getSmartWallet(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(201).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Close With Maximum Gas Price Strategy (Close to Collateral) with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/close-with-maximum-gasprice/to-debt:
 *   post:
 *     summary: Subscribe to a Aave V3 Close With Maximum Gas Price strategy (Close to Debt)
 *     tags:
 *      - AaveV3
 *     description: Subscribes to Aave V3 Close With Maximum Gas Price strategy that closes the position to debt token
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
 *               - baseTokenSymbol
 *               - quoteTokenSymbol
 *               - price
 *               - maximumGasPrice
 *               - ratioState
 *               - collSymbol
 *               - collAssetId
 *               - debtSymbol
 *               - debtAssetId
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              baseTokenSymbol:
 *                  type: string
 *                  example: "WETH"
 *                  description: "Base token symbol for the trigger (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              quoteTokenSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Quote token symbol for the trigger (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              price:
 *                  type: integer
 *                  example: 1000000000000000000
 *                  description: "Trigger price"
 *              maximumGasPrice:
 *                  type: integer
 *                  example: 100
 *                  description: "Maximum gas price"
 *              ratioState:
 *                  type: integer
 *                  example: 0
 *                  description: "Ratio state"
 *              collSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              collAssetId:
 *                  type: integer
 *                  example: 0
 *                  description: "Collateral asset ID"
 *              debtSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              debtAssetId:
 *                  type: integer
 *                  example: 4
 *                  description: "Debt asset ID"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/close-with-maximum-gasprice/to-debt", body(
    [
        "vnetUrl",
        "eoa",
        "baseTokenSymbol",
        "quoteTokenSymbol",
        "price",
        "maximumGasPrice",
        "ratioState",
        "collSymbol",
        "collAssetId",
        "debtSymbol",
        "debtAssetId"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        eoa,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        maximumGasPrice,
        collSymbol,
        collAssetId,
        debtSymbol,
        debtAssetId
    } = req.body;
    const isCloseToColl = false; // Hardcoded for close to debt route

    await setupVnet(vnetUrl, [eoa]);
    subAaveV3CloseWithMaximumGasPriceStrategy(
        eoa,
        isCloseToColl,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        maximumGasPrice,
        collSymbol,
        collAssetId,
        debtSymbol,
        debtAssetId,
        getSmartWallet(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(201).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Close With Maximum Gas Price Strategy (Close to Debt) with error : ${err.toString()}` });
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - triggerBaseAssetSymbol
 *               - triggerQuoteAssetSymbol
 *               - price
 *               - ratioState
 *               - collSymbol
 *               - debtSymbol
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              baseTokenSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Base token symbol for the trigger (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              quoteTokenSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Quote token symbol for the trigger (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              price:
 *                  type: integer
 *                  example: 2000
 *                  description: "Trigger price"
 *              ratioState:
 *                  type: string
 *                  description: "'OVER' or 'UNDER'"
 *                  example: "OVER"
 *              collSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              debtSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
        "vnetUrl",
        "eoa",
        "baseTokenSymbol",
        "quoteTokenSymbol",
        "price",
        "ratioState",
        "collSymbol",
        "debtSymbol"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        market,
        eoa,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        collSymbol,
        debtSymbol
    } = req.body;

    await setupVnet(vnetUrl, [eoa]);

    subAaveCloseToCollStrategy(
        market,
        eoa,
        baseTokenSymbol,
        quoteTokenSymbol,
        price,
        ratioState,
        collSymbol,
        debtSymbol,
        getSmartWallet(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 Close Price Strategy with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/leverage-management/sub-proxy:
 *   post:
 *     summary: Subscribe to a Aave V3 Leverage Management Sub Proxy strategy
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              eoa:
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
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
router.post("/leverage-management/sub-proxy", async (req, res) => {
    let resObj;

    try {
        const { vnetUrl, eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        const sub = await subAaveV3LeverageManagementWithSubProxyStrategy(
            eoa,
            minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled,
            getSmartWallet(req), defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Aave V3 Leverage Management Sub Proxy strategy with error : ${err.toString()}` };
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
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - price
 *               - ratioState
 *               - collSymbol
 *               - debtSymbol
 *               - targetRatio
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              price:
 *                  type: integer
 *                  example: 2000
 *                  description: "Trigger price"
 *              ratioState:
 *                  type: string
 *                  description: "'OVER' or 'UNDER'"
 *                  example: "UNDER"
 *              collSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              debtSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              targetRatio:
 *                  type: number
 *                  example: 130
 *                  description: "Target ratio"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
        "vnetUrl",
        "eoa",
        "price",
        "ratioState",
        "collSymbol",
        "debtSymbol",
        "targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        market,
        eoa,
        price,
        ratioState,
        collSymbol,
        debtSymbol,
        targetRatio
    } = req.body;

    await setupVnet(vnetUrl, [eoa]);

    subAaveV3OpenOrderFromCollateral(
        market,
        eoa,
        price,
        ratioState,
        collSymbol,
        debtSymbol,
        targetRatio,
        getSmartWallet(req),
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *              eoa:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *              price:
 *                  type: integer
 *                  example: 2000
 *                  description: "Trigger price"
 *              ratioState:
 *                  type: string
 *                  description: "'OVER' or 'UNDER'"
 *                  example: "UNDER"
 *              collSymbol:
 *                  type: string
 *                  example: "ETH"
 *                  description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              debtSymbol:
 *                  type: string
 *                  example: "DAI"
 *                  description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *              targetRatio:
 *                  type: number
 *                  example: 130
 *                  description: "Target ratio"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
        "vnetUrl",
        "eoa",
        "price",
        "ratioState",
        "collSymbol",
        "debtSymbol",
        "targetRatio"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        market,
        eoa,
        price,
        ratioState,
        collSymbol,
        debtSymbol,
        targetRatio
    } = req.body;

    await setupVnet(vnetUrl, [eoa]);

    subAaveV3RepayOnPrice(
        market,
        eoa,
        price,
        ratioState,
        collSymbol,
        debtSymbol,
        targetRatio,
        getSmartWallet(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 repay on price strategy with error: ${err.toString()}` });
    });
});

/**
 * @swagger
 * /aave/v3/strategies/leverage-management/generic/eoa:
 *   post:
 *     summary: Subscribe to Aave V3 Leverage Management Generic strategy (EOA)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Leverage Management Generic strategy for EOA positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Leverage Management Generic strategy (EOA)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - ratioState
 *               - targetRatio
 *               - triggerRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Leverage Management Generic (EOA) strategy with error: ..."
 */
router.post("/leverage-management/generic/eoa",
    body(["vnetUrl", "eoa", "ratioState", "targetRatio", "triggerRatio"]).notEmpty(),
    body("ratioState").isInt(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, ratioState, targetRatio, triggerRatio } = req.body;
        const isEOA = true; // Hardcoded for EOA route
        const isGeneric = true; // Hardcoded for generic route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3GenericAutomationStrategy(
            eoa,
            market,
            isEOA,
            ratioState,
            targetRatio,
            triggerRatio,
            isGeneric,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Leverage Management Generic (EOA) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/leverage-management/generic/smart-wallet:
 *   post:
 *     summary: Subscribe to Aave V3 Leverage Management Generic strategy (Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Leverage Management Generic strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Leverage Management Generic strategy (Smart Wallet)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - ratioState
 *               - targetRatio
 *               - triggerRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Leverage Management Generic (Smart Wallet) strategy with error: ..."
 */
router.post("/leverage-management/generic/smart-wallet",
    body(["vnetUrl", "eoa", "ratioState", "targetRatio", "triggerRatio"]).notEmpty(),
    body("ratioState").isInt(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, ratioState, targetRatio, triggerRatio } = req.body;
        const isEOA = false; // Hardcoded for Smart Wallet route
        const isGeneric = true; // Hardcoded for generic route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3GenericAutomationStrategy(
            eoa,
            market,
            isEOA,
            ratioState,
            targetRatio,
            triggerRatio,
            isGeneric,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Leverage Management Generic (Smart Wallet) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/leverage-management/without-sub-proxy/:
 *   post:
 *     summary: Subscribe to Aave V3 Leverage Management strategy (Smart Wallet, non-generic)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Leverage Management strategy for Smart Wallet positions (non-generic, without sub-proxy).
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Leverage Management strategy (Smart Wallet, non-generic)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - ratioState
 *               - targetRatio
 *               - triggerRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Leverage Management (Without Sub Proxy) strategy with error: ..."
 */
router.post("/leverage-management/without-sub-proxy",
    body(["vnetUrl", "eoa", "ratioState", "targetRatio", "triggerRatio"]).notEmpty(),
    body("ratioState").isInt(),
    body("targetRatio").isFloat({ gt: 0 }),
    body("triggerRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { vnetUrl, eoa, market, ratioState, targetRatio, triggerRatio } = req.body;
        const isEOA = false; // Hardcoded for Smart Wallet route
        const isGeneric = false; // Hardcoded for non-generic route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3GenericAutomationStrategy(
            eoa,
            market,
            isEOA,
            ratioState,
            targetRatio,
            triggerRatio,
            isGeneric,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Leverage Management (Without Sub Proxy) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/repay-on-price/generic/eoa:
 *   post:
 *     summary: Subscribe to Aave V3 Repay On Price Generic strategy (EOA)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Repay On Price Generic strategy for EOA positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Repay On Price Generic strategy (EOA)
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
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Repay On Price Generic (EOA) strategy with error: ..."
 */
router.post("/repay-on-price/generic/eoa",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "triggerPrice", "priceState", "targetRatio"]).notEmpty(),
    body("priceState").isInt(),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio
        } = req.body;
        const isEOA = true; // Hardcoded for EOA route
        const isBoost = false; // Hardcoded for repay route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3LeverageManagementOnPriceGeneric(
            eoa,
            market,
            isEOA,
            isBoost,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Repay On Price Generic (EOA) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/repay-on-price/generic/smart-wallet:
 *   post:
 *     summary: Subscribe to Aave V3 Repay On Price Generic strategy (Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Repay On Price Generic strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Repay On Price Generic strategy (Smart Wallet)
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
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Repay On Price Generic (Smart Wallet) strategy with error: ..."
 */
router.post("/repay-on-price/generic/smart-wallet",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "triggerPrice", "priceState", "targetRatio"]).notEmpty(),
    body("priceState").isInt(),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio
        } = req.body;
        const isEOA = false; // Hardcoded for Smart Wallet route
        const isBoost = false; // Hardcoded for repay route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3LeverageManagementOnPriceGeneric(
            eoa,
            market,
            isEOA,
            isBoost,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Repay On Price Generic (Smart Wallet) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/boost-on-price/generic/eoa:
 *   post:
 *     summary: Subscribe to Aave V3 Boost On Price Generic strategy (EOA)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Boost On Price Generic strategy for EOA positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Boost On Price Generic strategy (EOA)
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
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Boost On Price Generic (EOA) strategy with error: ..."
 */
router.post("/boost-on-price/generic/eoa",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "triggerPrice", "priceState", "targetRatio"]).notEmpty(),
    body("priceState").isInt(),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio
        } = req.body;
        const isEOA = true; // Hardcoded for EOA route
        const isBoost = true; // Hardcoded for boost route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3LeverageManagementOnPriceGeneric(
            eoa,
            market,
            isEOA,
            isBoost,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Boost On Price Generic (EOA) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/boost-on-price/generic/smart-wallet:
 *   post:
 *     summary: Subscribe to Aave V3 Boost On Price Generic strategy (Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Boost On Price Generic strategy for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Boost On Price Generic strategy (Smart Wallet)
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
 *               - triggerPrice
 *               - priceState
 *               - targetRatio
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Boost On Price Generic (Smart Wallet) strategy with error: ..."
 */
router.post("/boost-on-price/generic/smart-wallet",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "triggerPrice", "priceState", "targetRatio"]).notEmpty(),
    body("priceState").isInt(),
    body("triggerPrice").isFloat({ gt: 0 }),
    body("targetRatio").isFloat({ gt: 0 }),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const {
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio
        } = req.body;
        const isEOA = false; // Hardcoded for Smart Wallet route
        const isBoost = true; // Hardcoded for boost route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3LeverageManagementOnPriceGeneric(
            eoa,
            market,
            isEOA,
            isBoost,
            collSymbol,
            debtSymbol,
            triggerPrice,
            priceState,
            targetRatio,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Boost On Price Generic (Smart Wallet) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/close-on-price/generic/eoa:
 *   post:
 *     summary: Subscribe to Aave V3 Close On Price Generic strategy (EOA)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Close On Price strategy with stop loss and take profit functionality for EOA positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Close On Price Generic strategy (EOA)
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
 *               - stopLossPrice
 *               - stopLossType
 *               - takeProfitPrice
 *               - takeProfitType
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address that will own the strategy"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Close On Price Generic (EOA) strategy with error: ..."
 */
router.post("/close-on-price/generic/eoa",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "stopLossPrice", "stopLossType", "takeProfitPrice", "takeProfitType"]).notEmpty(),
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
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        } = req.body;
        const isEOA = true; // Hardcoded for EOA route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3CloseOnPriceGeneric(
            eoa,
            market,
            isEOA,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Close On Price Generic (EOA) strategy with error: ${err.toString()}` });
            });
    });

/**
 * @swagger
 * /aave/v3/strategies/close-on-price/generic/smart-wallet:
 *   post:
 *     summary: Subscribe to Aave V3 Close On Price Generic strategy (Smart Wallet)
 *     tags:
 *       - AaveV3
 *     description: Subscribes to Aave V3 Close On Price strategy with stop loss and take profit functionality for Smart Wallet positions.
 *     requestBody:
 *       description: Request body for subscribing to Aave V3 Close On Price Generic strategy (Smart Wallet)
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
 *               - stopLossPrice
 *               - stopLossType
 *               - takeProfitPrice
 *               - takeProfitType
 *             properties:
 *               vnetUrl:
 *                 type: string
 *                 example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                 description: "Unique identifier for the vnet"
 *               eoa:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: "EOA address"
 *               market:
 *                 type: string
 *                 example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                 description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral asset symbol"
 *               debtSymbol:
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
 *               smartWallet:
 *                 type: string
 *                 example: "0x0000000000000000000000000000000000000000"
 *                 description: "Optional proxy address. If not provided, a new wallet will be created"
 *               walletType:
 *                 type: string
 *                 example: "safe"
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
 *                   example: "Failed to subscribe to Aave V3 Close On Price Generic (Smart Wallet) strategy with error: ..."
 */
router.post("/close-on-price/generic/smart-wallet",
    body(["vnetUrl", "eoa", "collSymbol", "debtSymbol", "stopLossPrice", "stopLossType", "takeProfitPrice", "takeProfitType"]).notEmpty(),
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
            vnetUrl,
            eoa,
            market,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        } = req.body;
        const isEOA = false; // Hardcoded for Smart Wallet route

        await setupVnet(vnetUrl, [eoa]);

        subAaveV3CloseOnPriceGeneric(
            eoa,
            market,
            isEOA,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType,
            getSmartWallet(req),
            defaultsToSafe(req)
        )
            .then(sub => {
                res.status(200).send(sub);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to subscribe to Aave V3 Close On Price Generic (Smart Wallet) strategy with error: ${err.toString()}` });
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/bb3fe51f-1769-48b7-937d-50a524a63dae"
 *                description: "Unique identifier for the vnet"
 *              market:
 *                type: string
 *                example: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
 *                description: "Aave V3 market address. Optional - if not provided, the default market for the chain will be used."
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *                description: "EOA address"
 *              price:
 *                  type: integer
 *                  example: 2000
 *                  description: "Trigger price"
 *              ratioState:
 *                  type: string
 *                  description: "'OVER' or 'UNDER'"
 *                  example: "UNDER"
 *              fromAssetSymbol:
 *                  type: string
 *                  example: "WETH"
 *                  description: "Symbol of the collateral asset to switch from (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              toAssetSymbol:
 *                  type: string
 *                  example: "USDC"
 *                  description: "Symbol of the collateral asset to switch to (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *              amountToSwitch:
 *                  type: number
 *                  example: 1.5
 *                  description: "Amount of collateral to switch (ignored if isMaxUintSwitch is true)"
 *              isMaxUintSwitch:
 *                  type: boolean
 *                  example: false
 *                  description: "If true, use MaxUint256 instead of amountToSwitch value"
 *              smartWallet:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "The address of the wallet that will be used for the position, if not provided a new wallet will be created"
 *              walletType:
 *                type: string
 *                example: "safe"
 *                description: "Whether to use the safe as smart wallet or dsproxy if smartWallet is not provided. WalletType field is not mandatory. Defaults to safe"
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
        "vnetUrl",
        "eoa",
        "price",
        "ratioState",
        "fromAssetSymbol",
        "toAssetSymbol",
        "amountToSwitch"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        vnetUrl,
        market,
        eoa,
        price,
        ratioState,
        fromAssetSymbol,
        toAssetSymbol,
        amountToSwitch,
        isMaxUintSwitch
    } = req.body;

    await setupVnet(vnetUrl, [eoa]);

    subAaveV3CollateralSwitch(
        eoa,
        market,
        fromAssetSymbol,
        toAssetSymbol,
        amountToSwitch,
        isMaxUintSwitch || false,
        price,
        ratioState,
        getSmartWallet(req),
        defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to Aave V3 collateral switch strategy with error: ${err.toString()}` });
    });
});

module.exports = router;
