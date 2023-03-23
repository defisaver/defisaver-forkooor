const express = require("express");
const { createMcdVault } = require("../../helpers/maker/general");

const router = express.Router();


/**
 * @swagger
 * /maker/general/create:
 *   post:
 *     summary: 
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
 *              senderAcc:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              collType:
 *                type: string
 *                example: "ETH-A"
 *              collAmount:
 *                type: integer
 *                example: 100
 *              debtAmount: 
 *                type: integer
 *                example: 50000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 forkId:
 *                   type: string
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
router.post("/create", async (req, res) => {
    let resObj;
    try {
        //<type> <coll> <debt> 
        const { forkId, senderAcc, collType, collAmount, debtAmount } = req.body;
        await createMcdVault(forkId, collType, collAmount, debtAmount, senderAcc);
        // resObj = getMakerPositionInfo()
        res.status(200).send(resObj);
    } catch(err){
        resObj = { "error" : "Failed to create a position" };
        res.status(500).send(resObj); 
    }
});


module.exports = router;