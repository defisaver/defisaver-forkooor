/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork } = require("../../utils");
const { subFluidT1LeverageManagement } = require("../../helpers/fluid/strategies");

const router = express.Router();

/**
 * @swagger
 * /fluid/strategies/leverage-management-t1:
 *   post:
 *     summary: Subscribe to a Fluid T1 leverage management strategy
 *     tags:
 *      - Fluid
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
 *              nftId:
 *                type: string
 *                example: "1000"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                 type: integer
 *                 example: 300
 *              ratioState:
 *                 type: string
 *                 example: under
 *                 description: "under = repay and over = boost"
 *              bundleId:
 *                 type: string
 *                 example: "44 for repay, 45 for boost"
 *                 description: "Bundle ID"
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
 *                   example: [
 *                      "44",
 *                      true,
 *                      [
 *                        "0x0000000000000000000000000000000000000000000000000000000000000ed50000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"
 *                      ],
 *                      [
 *                        "0x0000000000000000000000000000000000000000000000000000000000000ed5",
 *                        "0x0000000000000000000000000c8c77b7ff4c2af7f6cebbe67350a490e3dd6cb3",
 *                        "0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
 *                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
 *                        "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                        "0x00000000000000000000000000000000000000000000000029a2241af62c0000",
 *                        "0x0000000000000000000000000000000000000000000000000000000000000001",
 *                        "0x0000000000000000000000000000000000000000000000000000000000000000"
 *                      ]
 *                    ]
 *                 subId:
 *                   type: string
 *                   example: "1734"
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
router.post("/leverage-management-t1", async (req, res) => {
    let resObj;

    try {
        const { forkId, nftId, triggerRatio, targetRatio, ratioState, bundleId } = req.body;

        await setupFork(forkId);

        const sub = await subFluidT1LeverageManagement(
            nftId,
            triggerRatio,
            targetRatio,
            ratioState,
            bundleId
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to Fluid T1 lev. management automation strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
