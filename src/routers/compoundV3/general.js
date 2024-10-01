/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable consistent-return */
const express = require("express");
const { setupFork, getProxy, isContract, getWalletAddr, defaultsToSafe } = require("../../utils");
const { getLoanData } = require("../../helpers/compoundV3/view");
const {
    createCompoundV3Position
} = require("../../helpers/compoundV3/general");
const { body, validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /compound/v3/general/get-position:
 *   post:
 *     summary: Fetch info about CompoundV3 position on a fork
 *     tags:
 *      - CompoundV3
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
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0xc3d688B66703497DAA19211EEdff47f25384cdc3"
 *              owner:
 *                type: string
 *                example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                    - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                    - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 depositAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit amount"
 *                 depositValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit value"
 *                 borrowAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow amount"
 *                 borrowValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow value"
 *                 collValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "coll value"
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
router.post("/get-position",
    body(["forkId", "market", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { forkId, market, owner } = req.body;
        let proxy = owner;

        const isContractPromise = isContract(owner);

        setupFork(forkId);

        if (!await isContractPromise) {
            const proxyContract = await getProxy(owner);

            proxy = proxyContract.address;
        }

        await getLoanData(market, proxy)
            .then(pos => {
                res.status(200).send(pos);
            }).catch(err => {
                res.status(500).send({ error: `Failed to fetch position info with error : ${err.toString()}` });
            });
    });


/**
 * @swagger
 * /compound/v3/general/create:
 *   post:
 *     summary: Create CompoundV3 position on a fork
 *     tags:
 *      - CompoundV3
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
 *                example: "3f5a3245-131d-42b7-8824-8a408a8cb71c"
 *              market:
 *                type: string
 *                example: "0xc3d688B66703497DAA19211EEdff47f25384cdc3"
 *              owner:
 *                type: string
 *                example: "0x499CC74894FDA108c5D32061787e98d1019e64D0"
 *                description: "The the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided"
 *              collToken:
 *                type: string
 *                example: "WETH"
 *              collAmount:
 *                type: number
 *                example: 3
 *              borrowToken:
 *                type: string
 *                example: "USDC"
 *              borrowAmount:
 *                type: number
 *                example: 2000
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
 *                 user:
 *                   type: string
 *                   example: "0x45a933848c814868307c184F135Cf146eDA28Cc5"
 *                   description: "Ethereum address of the user"
 *                 collAddr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                    - "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
 *                    - "0x0000000000000000000000000000000000000000"
 *                   description: "Array of collateral addresses"
 *                 collAmounts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "3794452463777"
 *                     - "0"
 *                   description: "Array of collateral amounts corresponding to each collateral address"
 *                 depositAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit amount"
 *                 depositValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "deposit value"
 *                 borrowAmount:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow amount"
 *                 borrowValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "borrow value"
 *                 collValue:
 *                   type: string
 *                   example: "3794452463777"
 *                   description: "coll value"
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
router.post("/create",
    body(["forkId", "market", "collToken", "collAmount", "borrowToken", "borrowAmount", "owner"]).notEmpty(),
    async (req, res) => {
        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            return res.status(400).send({ error: validationErrors.array() });
        }

        const { forkId, market, collToken, collAmount, borrowToken, borrowAmount, owner } = req.body;

        await setupFork(forkId, [owner]);

        createCompoundV3Position(market, collToken, collAmount, borrowToken, borrowAmount, owner, getWalletAddr(req), defaultsToSafe(req))
            .then(pos => {
                res.status(200).send(pos);
            })
            .catch(err => {
                res.status(500).send({ error: `Failed to create position info with error : ${err.toString()}` });
            });
    });

module.exports = router;
