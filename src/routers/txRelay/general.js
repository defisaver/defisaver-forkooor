/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { body, validationResult } = require("express-validator");
const { setupFork, getTestSignerUsingPrivateKey } = require("../../utils");
const { signCreationOfAaveV3Position, executeTxRelaySignedTx } = require("../../helpers/tx-relay/general");
const { setUpBotAccounts } = require("../../helpers/utils/general");
const router = express.Router();

/**
 * @swagger
 * /tx-relay/general/sing-aaveV3-position-creation:
 *   post:
 *     summary: Sign creation of AaveV3 position on a fork
 *     tags:
 *       - TxRelay
 *     description: Endpoint to sign the creation of an AaveV3 position on a fork.
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forkId:
 *                 type: string
 *                 example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *               testAccountNumber:
 *                 type: number
 *                 example: 1
 *                 description: Test account used for signing safe tx. Allowed values are [1-5].
 *               shouldCreateNewSafe:
 *                 type: boolean
 *                 example: true
 *                 description: Whether to create a new safe or use an existing one.
 *               existingSafeAddress:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: Address of the existing safe. Only used if shouldCreateNewSafe is false.
 *               txRelayData:
 *                 type: object
 *                 properties:
 *                   feeToken:
 *                     type: string
 *                     example: "DAI"
 *                     description: Token used for paying the fee.
 *                   maxGasPrice:
 *                     type: number
 *                     example: 1000
 *                     description: Maximum gas price user is willing to pay for tx.
 *                   maxTxCostInFeeToken:
 *                     type: number
 *                     example: 10000
 *                     description: Maximum tx cost in fee token user is willing to pay for fee.
 *               aaveData:
 *                 type: object
 *                 properties:
 *                   collToken:
 *                     type: string
 *                     example: "ETH"
 *                   debtToken:
 *                     type: string
 *                     example: "DAI"
 *                   rateMode:
 *                     type: number
 *                     example: 2
 *                     description: "2 For variable rate and 1 for stable rate"
 *                   collAmount:
 *                     type: number
 *                     example: 2
 *                   debtAmount:
 *                     type: number
 *                     example: 2000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 safeTxParams:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       example: 0
 *                       description: Eth value sent in safe tx.
 *                     safe:
 *                       type: string
 *                       example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                       description: Address of the safe.
 *                     data:
 *                       type: string
 *                       description: Encoded function data to be sent in safe transaction.
 *                     signatures:
 *                       type: string
 *                       description: Signatures of the safe transaction.
 *                 signedMessageHash:
 *                   type: string
 *                   description: Message hash of safe tx that will be signed by the user.
 *                 eoa:
 *                   type: string
 *                   example: "0x8428ef2286819790A310FC72013bbf4dc8fF2D06"
 *                   description: Address of the signer
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
router.post("/sing-aaveV3-position-creation", body(
    [
        "forkId",
        "testAccountNumber",
        "shouldCreateNewSafe",
        "existingSafeAddress",

        "txRelayData.feeToken",
        "txRelayData.maxGasPrice",
        "txRelayData.maxTxCostInFeeToken",

        "aaveData.collToken",
        "aaveData.debtToken",
        "aaveData.rateMode",
        "aaveData.collAmount",
        "aaveData.debtAmount"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }

    const {
        forkId,
        testAccountNumber,
        shouldCreateNewSafe,
        existingSafeAddress,
        txRelayData,
        aaveData
    } = req.body;

    const singer = await getTestSignerUsingPrivateKey(testAccountNumber);

    await setupFork(forkId, [singer.address]);

    signCreationOfAaveV3Position(
        testAccountNumber,
        shouldCreateNewSafe,
        existingSafeAddress,
        txRelayData,
        aaveData
    )
        .then(pos => {
            res.status(200).send(pos);
        })
        .catch(err => {
            res.status(500).send({ error: `Failed to sign aaveV3 position creation. Error : ${err.toString()}` });
        });

});

/**
 * @swagger
 * /tx-relay/general/execute:
 *   post:
 *     summary: Execute a transaction
 *     tags:
 *       - TxRelay
 *     description: Execute signed transaction on tx relay.
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forkId:
 *                 type: string
 *                 example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *                 description: Identifier of the fork.
 *               value:
 *                 type: number
 *                 example: 0
 *                 description: Eth value sent in safe tx.
 *               safe:
 *                 type: string
 *                 example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                 description: Address of the safe.
 *               data:
 *                 type: string
 *                 description: Encoded function data to be sent in safe transaction.
 *               signatures:
 *                 type: string
 *                 description: Signatures of the safe transaction.
 *               botAddress:
 *                 type: string
 *                 example: "0x8428ef2286819790A310FC72013bbf4dc8fF2D06"
 *                 description: Address of the bot executing the transaction.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: Result of the transaction execution.
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
router.post("/execute", body(
    [
        "forkId",
        "value",
        "safe",
        "data",
        "signatures",
        "botAddress"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }

    const {
        forkId,
        value,
        safe,
        data,
        signatures,
        botAddress
    } = req.body;

    await setUpBotAccounts(forkId, [botAddress]);

    executeTxRelaySignedTx(
        value,
        safe,
        data,
        signatures,
        botAddress
    )
        .then(pos => {
            if (pos.status === 0) {
                res.status(500).send({ error: "Tx reverted" });
            } else {
                res.status(200).send(pos);
            }
        })
        .catch(err => {
            res.status(500).send({ error: `Failed to execute signed function on tx relay. Error : ${err.toString()}` });
        });

});


module.exports = router;
