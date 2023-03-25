/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { subMcdCloseToDaiStrategy, subMcdCloseToCollStrategy } = require("../../helpers/maker/strategies");
const { setupFork } = require("../../utils");

const router = express.Router();

/**
 * @swagger
 * /maker/strategies/mcd-close-to-dai:
 *   post:
 *     summary: Fetch info about MCD vault on a fork
 *     tags:
 *      - Maker
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
router.post("/mcd-close-to-dai", async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, triggerPrice, triggerState, owner } = req.body;

        await setupFork(forkId, owner);

        const sub = await subMcdCloseToDaiStrategy(forkId, vaultId, triggerPrice, triggerState, owner);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: "Failed to fetch vault info" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /maker/strategies/mcd-close-to-coll:
 *   post:
 *     summary: Fetch info about MCD vault on a fork
 *     tags:
 *      - Maker
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
router.post("/mcd-close-to-coll", async (req, res) => {
    let resObj;

    try {
        const { forkId, vaultId, triggerPrice, triggerState, owner } = req.body;

        await setupFork(forkId, owner);

        const sub = await subMcdCloseToCollStrategy(forkId, vaultId, triggerPrice, triggerState, owner);

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: "Failed to fetch vault info" };
        res.status(500).send(resObj, err);
    }
});

module.exports = router;
