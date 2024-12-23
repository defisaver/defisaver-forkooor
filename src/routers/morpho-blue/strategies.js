/* eslint-disable consistent-return */
/* eslint-disable jsdoc/check-tag-names */
const express = require("express");
const { setupFork, getWalletAddr, defaultsToSafe } = require("../../utils");
const { body, validationResult } = require("express-validator");
const { subMorphoBlueRepayBundle, subMorphoBlueBoostBundle, subMorphoBlueBoostOnPriceBundle } = require("../../helpers/morpho-blue/strategies");
const { getMarketId } = require("../../helpers/morpho-blue/view");

const router = express.Router();


/**
 * @swagger
 * /morpho-blue/strategies/repay:
 *   post:
 *     summary: Subscribe to a MorphoBlue Repay strategy
 *     tags:
 *      - MorphoBlue
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
 *              bundleId:
 *                  type: integer
 *                  example: 32
 *              loanToken:
 *                type: string
 *                example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *              collateralToken:
 *                type: string
 *                example: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              minRatio:
 *                  type: integer
 *                  example: 250
 *              targetRatio:
 *                  type: integer
 *                  example: 300
 *              user:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
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
 *                  example: [    26,    true,    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000a688906bd8b0000000000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000000"    ],    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f","0x0000000000000000000000000000000000000000000000000000000000000004","0x0000000000000000000000000000000000000000000000000000000000000000"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/repay", body(
    [
        "forkId",
        "owner",
        "bundleId",
        "loanToken",
        "collateralToken",
        "oracle",
        "irm",
        "lltv",
        "minRatio",
        "targetRatio",
        "user"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, owner, bundleId, loanToken, collateralToken, oracle, irm, lltv, minRatio, targetRatio, user } = req.body;

    await setupFork(forkId, [owner]);
    const marketId = await getMarketId({ loanToken, collateralToken, oracle, irm, lltv });

    subMorphoBlueRepayBundle(
        owner, bundleId, [loanToken, collateralToken, oracle, irm, lltv], marketId, minRatio, targetRatio, user, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to MorphoBlue Repay strategy with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /morpho-blue/strategies/boost:
 *   post:
 *     summary: Subscribe to a MorphoBlue Boost strategy
 *     tags:
 *      - MorphoBlue
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
 *              bundleId:
 *                  type: integer
 *                  example: 33
 *              loanToken:
 *                type: string
 *                example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *              collateralToken:
 *                type: string
 *                example: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              maxRatio:
 *                  type: integer
 *                  example: 300
 *              targetRatio:
 *                  type: integer
 *                  example: 250
 *              user:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
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
 *                  example: [    26,    true,    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000a688906bd8b0000000000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000000"    ],    [      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f","0x0000000000000000000000000000000000000000000000000000000000000004","0x0000000000000000000000000000000000000000000000000000000000000000"    ]  ]
 *                 subId:
 *                  type: string
 *                  example: "427"
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
router.post("/boost", body(
    [
        "forkId",
        "owner",
        "bundleId",
        "loanToken",
        "collateralToken",
        "oracle",
        "irm",
        "lltv",
        "maxRatio",
        "targetRatio",
        "user"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const { forkId, owner, bundleId, loanToken, collateralToken, oracle, irm, lltv, maxRatio, targetRatio, user } = req.body;

    await setupFork(forkId, [owner]);
    const marketId = await getMarketId({ loanToken, collateralToken, oracle, irm, lltv });

    subMorphoBlueBoostBundle(
        owner, bundleId, [loanToken, collateralToken, oracle, irm, lltv], marketId, maxRatio, targetRatio, user, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to MorphoBlue Repay strategy with error : ${err.toString()}` });
    });
});

/**
 * @swagger
 * /morpho-blue/strategies/boostOnPrice:
 *   post:
 *     summary: Subscribe to a MorphoBlue Boost On Price strategy
 *     tags:
 *      - MorphoBlue
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
 *              walletOwner:
 *                type: string
 *                example: "0x938D18B5bFb3d03D066052d6e513d2915d8797A0"
 *              bundleId:
 *                type: integer
 *                example: 37
 *              loanToken:
 *                type: string
 *                example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *              collateralToken:
 *                type: string
 *                example: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
 *              oracle:
 *                type: string
 *                example: "0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2"
 *              irm:
 *                type: string
 *                example: "0x870ac11d48b15db9a138cf899d20f13f79ba00bc"
 *              lltv:
 *                type: string
 *                example: "860000000000000000"
 *              targetRatio:
 *                type: integer
 *                example: 200
 *                description: "The target ratio to put the position at after the strategy is executed"
 *              price:
 *                type: integer
 *                example: 3000
 *              priceState:
 *                type: string
 *                example: 'under'
 *                description: whether to trigger when current price is 'under' or 'over' the 'price' field
 *              user:
 *                type: string
 *                example: "0x0000000000000000000000000000000000000000"
 *                description: "address(0) will default to the wallet address. Put walletOwner address for EOA automation"
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
 *                  example: [    37,    true,    [      "0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000045d964b8000000000000000000000000000000000000000000000000000000000000000001"    ],    [      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0","0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e2","0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc","0x0000000000000000000000000000000000000000000000000bef55718ad60000","0x0000000000000000000000000000000000000000000000001bc16d674ec80000","0x000000000000000000000000905b56d57d7e386c04e62d42c9d45a2aad88bd17"  ]  ]
 *                 subId:
 *                  type: string
 *                  example: "1636"
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
router.post("/boostOnPrice", body(
    [
        "forkId",
        "walletOwner",
        "bundleId",
        "loanToken",
        "collateralToken",
        "oracle",
        "irm",
        "lltv",
        "targetRatio",
        "price",
        "priceState",
        "user"
    ]
).notEmpty(),
async (req, res) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(400).send({ error: validationErrors.array() });
    }
    const {
        forkId, walletOwner, bundleId, loanToken, collateralToken, oracle, irm, lltv, targetRatio, price, priceState, user
    } = req.body;

    await setupFork(forkId, [walletOwner]);

    subMorphoBlueBoostOnPriceBundle(
        walletOwner, bundleId, [loanToken, collateralToken, oracle, irm, lltv], targetRatio, user, price, priceState, getWalletAddr(req), defaultsToSafe(req)
    ).then(sub => {
        res.status(200).send(sub);
    }).catch(err => {
        res.status(500).send({ error: `Failed to subscribe to MorphoBlue Boost on Price strategy with error : ${err.toString()}` });
    });
});

module.exports = router;
