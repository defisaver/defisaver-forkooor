/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork } = require("../../utils");
const { subSparkDfsAutomationStrategy } = require("../../helpers/spark/strategies");

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
 *              forkId:
 *                type: string
 *                example: "98d472f7-496f-4672-be5a-c3eeab31986f"
 *              owner:
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
        const { forkId, owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subSparkDfsAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Spark DFS Automation with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
