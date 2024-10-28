/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork, defaultsToSafe, getWalletAddr } = require("../../utils");
const { subLiquityV2LeverageManagement } = require("../../helpers/liquityV2/strategies");

const router = express.Router();

/**
 * @swagger
 * /liquity/v2/strategies/leverage-management:
 *   post:
 *     summary: Subscribe to a LiquityV2 leverage management strategy
 *     tags:
 *      - LiquityV2
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
 *                description: "Proxy owner"
 *              market:
 *                type: string
 *                example: "WETH"
 *              troveId:
 *                type: string
 *                example: "67184417072818233280725568262249615620428873967209498483128454952353873041915"
 *              triggerRatio:
 *                type: integer
 *                example: 200
 *              targetRatio:
 *                 type: integer
 *                 example: 300
 *              ratioState:
 *                 type: integer
 *                 example: 1
 *                 description: "1 for UNDER/REPAY and 2 for OVER/BOOST"
 *              bundleId:
 *                 type: string
 *                 example: 37
 *                 description: "Bundle ID"
 *              walletAddr:
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
 *                  example: [
*                       "37",
*                       true,
*                       [
*                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9df4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f0000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000001"
*                       ],
*                       [
*                           "0x0000000000000000000000007d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
*                           "0xf4f1c8395f7f3fcd541310d70d3699bc8dbf45bb99f4959408de67c30f91d05f",
*                           "0x0000000000000000000000000000000000000000000000000000000000000001",
*                           "0x00000000000000000000000000000000000000000000000029a2241af62c0000",
*                           "0x0000000000000000000000000000000000000000000000000000000000000001",
*                           "0x0000000000000000000000000000000000000000000000000000000000000000"
*                       ]
 *                  ]
 *                 subId:
 *                  type: string
 *                  example: "1509"
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
router.post("/leverage-management", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, market, troveId, triggerRatio, targetRatio, ratioState, bundleId } = req.body;

        await setupFork(forkId, [owner]);

        const sub = await subLiquityV2LeverageManagement(
            owner,
            market,
            troveId,
            triggerRatio,
            targetRatio,
            ratioState,
            bundleId,
            getWalletAddr(req),
            defaultsToSafe(req)
        );

        res.status(200).send(sub);
    } catch (err) {
        resObj = { error: `Failed to subscribe to LiquityV2 leverage management strategy with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
