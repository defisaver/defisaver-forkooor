/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { subMcdCloseToDaiStrategy, subMcdCloseToCollStrategy, subMCDSmartSavingsRepayStrategy, subMcdAutomationStrategy } = require("../../helpers/maker/strategies");
const { setupFork } = require("../../utils");
const { body } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /maker/strategies/close-to-dai:
 *   post:
 *     summary: Subscribe to MCD Close to DAI strategy
 *     tags:
 *      - Maker
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
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              triggerPrice:
 *                type: integer
 *                example: 1500
 *              triggerState:
 *                type: string
 *                example: "UNDER"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
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
 *                  example: [    7,    false,    [      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
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
router.post("/close-to-dai", async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, triggerPrice, triggerState, owner } = req.body;

        await setupFork(forkId, [owner]);
        const sub = await subMcdCloseToDaiStrategy(vaultId, triggerPrice, triggerState, owner);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to MCD close to DAI strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /maker/strategies/close-to-coll:
 *   post:
 *     summary: Subscribe to a MCD Close to Coll strategy
 *     tags:
 *      - Maker
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
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              triggerPrice:
 *                type: integer
 *                example: 1500
 *              triggerState:
 *                type: string
 *                example: "UNDER"
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
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
router.post("/close-to-coll", async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, triggerPrice, triggerState, owner } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subMcdCloseToCollStrategy(vaultId, triggerPrice, triggerState, owner);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to MCD close to coll strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /maker/strategies/smart-savings-repay:
 *   post:
 *     summary: Subscribe to a MCD Repay from smart savings bundle
 *     tags:
 *      - Maker
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
 *              vaultId:
 *                type: integer
 *                example: 29721
 *              protocol:
 *                type: string
 *                example: "rari"
 *              minRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                type: integer
 *                example: 220
 *              owner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
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
 *                  example: [    2,    true,    [      "0x00000000000000000000000000000000000000000000000000000000000074190000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x0000000000000000000000000000000000000000000000000000000000007419",      "0x0000000000000000000000000000000000000000000000001e87f85809dc0000",      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",      "0x0000000000000000000000005ef30b9986345249bc32d8928b7ee64de9435e39"    ]  ]
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
router.post("/smart-savings-repay", async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, protocol, minRatio, targetRatio, owner } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subMCDSmartSavingsRepayStrategy(vaultId, protocol, minRatio, targetRatio, owner);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to MCD close to coll strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /maker/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a MCD Automation strategy
 *     tags:
 *      - Maker
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
 *              vaultId:
 *                type: integer
 *                example: 29721
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
router.post("/dfs-automation", body(
    [
        "forkId",
        "vaultId",
        "owner",
        "minRatio",
        "maxRatio",
        "targetRepayRatio",
        "targetBoostRatio",
        "boostEnabled"
    ]
).notEmpty(),
async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subMcdAutomationStrategy(vaultId, owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to MCD automation strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});


module.exports = router;
