const express = require("express");
const { setupFork } = require("../../utils");
const { subLiqutityDsrPaybackStrategy, subLiqutityDsrSupplyStrategy } = require("../../helpers/liquity/strategies");

const router = express.Router();

/**
 * @swagger
 * /liquity/strategies/dsr-payback:
 *   post:
 *     summary: Subscribe to a Liquity Dsr Payback strategy
 *     tags:
 *      - Liquity
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                type: integer
 *                example: 240
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
router.post("/dsr-payback", async (req, res) => {
    let resObj;

    try {
        const { forkId, sender, triggerRatio, targetRatio } = req.body;

        await setupFork(forkId, [sender]);

        const sub = await subLiqutityDsrPaybackStrategy({ sender, triggerRatio, targetRatio });

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Liquity Dsr Payback strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /liquity/strategies/dsr-supply:
 *   post:
 *     summary: Subscribe to a Liquity Dsr Supply strategy
 *     tags:
 *      - Liquity
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
 *                example: "29490d5a-f4ca-41fd-89db-fd19ea82d44b"
 *              sender:
 *                type: string
 *                example: "0x2264164cf3a4d68640ED088A97137f6aa6eaac00"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                type: integer
 *                example: 240
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
router.post("/dsr-supply", async (req, res) => {
    let resObj;

    try {
        const { forkId, sender, triggerRatio, targetRatio } = req.body;

        await setupFork(forkId, [sender]);

        const sub = await subLiqutityDsrSupplyStrategy({ sender, triggerRatio, targetRatio });

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Liquity Dsr Payback strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;