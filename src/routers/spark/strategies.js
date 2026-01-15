/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet, defaultsToSafe, getSmartWallet } = require("../../utils");
const { subSparkDfsAutomationStrategy, subSparkCloseOnPriceGeneric } = require("../../helpers/spark/strategies");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /spark/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a DFS Automation strategy
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
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              eoa:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              minRatio:
 *                type: integer
 *                example: 150
 *              maxRatio:
 *                type: integer
 *                example: 200
 *              targetRepayRatio:
 *                type: integer
 *                example: 180
 *              targetBoostRatio:
 *                type: integer
 *                example: 180
 *              boostEnabled:
 *                type: boolean
 *                example: true
 *              smartWallet:
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
 *                  example: [    9,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
 *                 repaySubId:
 *                  type: string
 *                  example: "230"
 *                 boostSubId:
 *                  type: string
 *                  example: "231"
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
        const { vnetUrl, eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        const sub = await subSparkDfsAutomationStrategy(
            eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, getSmartWallet(req), defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Spark DFS Automation with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /spark/strategies/close-on-price-generic:
 *   post:
 *     summary: Subscribe to Spark Close On Price strategy
 *     tags:
 *       - Spark
 *     description: Subscribes to Spark Close On Price strategy with stop loss and take profit functionality.
 *     requestBody:
 *       description: Request body for subscribing to Spark Close On Price strategy
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vnetUrl
 *               - eoa
 *               - bundleId
 *               - market
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
 *               bundleId:
 *                 type: integer
 *                 example: 57
 *                 description: "Bundle ID for the strategy. 57 - Close on price"
 *               market:
 *                 type: string
 *                 example: "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE"
 *                 description: "Spark market address"
 *               collSymbol:
 *                 type: string
 *                 example: "WETH"
 *                 description: "Collateral token symbol (e.g., ETH, WBTC, USDT). ETH will be automatically converted to WETH."
 *               debtSymbol:
 *                 type: string
 *                 example: "USDC"
 *                 description: "Debt token symbol (e.g., DAI, USDC, USDT). ETH will be automatically converted to WETH."
 *               stopLossPrice:
 *                 type: integer
 *                 example: 4000
 *                 description: "Stop loss price (0 if not used)"
 *               stopLossType:
 *                 type: integer
 *                 example: 0
 *                 description: "Stop loss type (0 for debt, 1 for collateral)"
 *               takeProfitPrice:
 *                 type: integer
 *                 example: 6000
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
 *                   example: "Failed to subscribe to Spark Close On Price strategy with error: ..."
 */
router.post("/close-on-price-generic",
    body(["vnetUrl", "eoa", "bundleId", "market", "collSymbol", "debtSymbol", "stopLossPrice", "stopLossType", "takeProfitPrice", "takeProfitType"]).notEmpty(),
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
            vnetUrl,
            eoa,
            bundleId,
            market,
            collSymbol,
            debtSymbol,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        } = req.body;

        await setupVnet(vnetUrl, [eoa]);

        subSparkCloseOnPriceGeneric(
            eoa,
            bundleId,
            market,
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
                res.status(500).send({ error: `Failed to subscribe to Spark Close On Price strategy with error: ${err.toString()}` });
            });
    });

module.exports = router;
