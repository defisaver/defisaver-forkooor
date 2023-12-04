/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork } = require("../../utils");
const { subCompoundV3AutomationStrategy } = require("../../helpers/compoundV3/strategies");

const router = express.Router();

/**
 * @swagger
 * /compound/v3/strategies/dfs-automation:
 *   post:
 *     summary: Subscribe to a Compound V3 Automation strategy
 *     tags:
 *      - CompoundV3
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
 *              market:
 *                type: string
 *                example: "0xc3d688B66703497DAA19211EEdff47f25384cdc3"
 *              baseToken:
 *                type: string
 *                example: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
 *                description: "Base token for market, e.g. USDC coin address"
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
 *              isEOA:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategySub:
 *                   type: Array
 *                   example: { "subId": "561",
 *                              "strategySub": [
 *                              31048,
 *                              "1500000000000000000",
 *                              "2000000000000000000",
 *                              "1800000000000000000",
 *                              "1800000000000000000",
 *                              true
 *                             ]}
 *                 subId:
 *                   type: string
 *                   example: "230"
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
    try {
        const {
            forkId,
            owner,
            market,
            baseToken,
            minRatio,
            maxRatio,
            targetRepayRatio,
            targetBoostRatio,
            boostEnabled,
            isEOA
        } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subCompoundV3AutomationStrategy(
            owner,
            market,
            baseToken,
            minRatio,
            maxRatio,
            targetRepayRatio,
            targetBoostRatio,
            boostEnabled,
            isEOA
        );

        res.status(200).send(sub);
    } catch (err) {
        const e = {
            error: `Failed to subscribe to Compound V3 automation strategy with error : ${err.toString()}`
        };

        res.status(500).send(e);
    }
});

module.exports = router;
