/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const {setupFork} = require("../../utils");
const {subAaveV3CloseWithMaximumGasPriceStrategy} = require("../../helpers/aavev3/strategies");

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
 *                  example: 68
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
 *                         example: 300000000000
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
router.post("/close-with-maximum-gasprice", async (req, res) => {
    // TODO update response example when finished
    const {forkId, owner, strategyOrBundleId, triggerData, subData} = req.body;

    if (typeof forkId === 'undefined' ||
        typeof owner === 'undefined' ||
        typeof strategyOrBundleId === 'undefined' ||
        typeof triggerData.baseTokenAddress === 'undefined' ||
        typeof triggerData.quoteTokenAddress === 'undefined' ||
        typeof triggerData.price === 'undefined' ||
        typeof triggerData.maximumGasPrice === 'undefined' ||
        typeof triggerData.ratioState === 'undefined' ||
        typeof subData.collAsset === 'undefined' ||
        typeof subData.collAssetId === 'undefined' ||
        typeof subData.debtAsset === 'undefined' ||
        typeof subData.debtAssetId === 'undefined'
    ) {
        res.status(400).send({error: "Invalid request body"});
    }

    await setupFork(forkId, [owner]);
    subAaveV3CloseWithMaximumGasPriceStrategy(
        owner, strategyOrBundleId,
        triggerData.baseTokenAddress, triggerData.quoteTokenAddress, triggerData.price, triggerData.maximumGasPrice, triggerData.ratioState,
        subData.collAsset, subData.collAssetId, subData.debtAsset, subData.debtAssetId
    ).then((sub) => {
        res.status(200).send(sub);
    }).catch((err) => {
        res.status(500).send({error: `Failed to subscribe to Aave V3 Close With Maximum Gas Price Strategy with error : ${err.toString()}`});
    });
});

module.exports = router;
