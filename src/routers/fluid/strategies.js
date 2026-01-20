/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupVnet } = require("../../utils");
const { body, validationResult } = require("express-validator");
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
 *             required:
 *               - vnetUrl
 *               - nftId
 *               - triggerRatio
 *               - targetRatio
 *               - ratioState
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/55aa2dae-1c9c-4c63-8ef4-36ad6a5594b7"
 *                description: "Unique identifier for the vnet"
 *              nftId:
 *                type: string
 *                example: "1000"
 *                description: "NFT ID representing the Fluid position"
 *              triggerRatio:
 *                type: number
 *                example: 200
 *                description: "Trigger ratio at which the strategy will execute"
 *              targetRatio:
 *                type: number
 *                example: 300
 *                description: "Target ratio to achieve after strategy execution"
 *              ratioState:
 *                type: string
 *                example: "under"
 *                description: "Ratio state: 'under' for repay strategy, 'over' for boost strategy"
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
router.post("/leverage-management-t1",
    body(["vnetUrl", "nftId", "triggerRatio", "targetRatio", "ratioState"]).notEmpty(),
    body(["triggerRatio", "targetRatio"]).isFloat({ gt: 0 }),
    body("ratioState").isIn(["under", "over"]),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        try {
            const { vnetUrl, nftId, triggerRatio, targetRatio, ratioState } = req.body;

            await setupVnet(vnetUrl, []);

            const sub = await subFluidT1LeverageManagement(
                nftId,
                triggerRatio,
                targetRatio,
                ratioState
            );

            res.status(200).send(sub);
        } catch (err) {
            res.status(500).send({ error: `Failed to subscribe to Fluid T1 leverage management automation strategy with error : ${err.toString()}` });
        }
    });

module.exports = router;
