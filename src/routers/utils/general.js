/* eslint-disable jsdoc/check-tag-names */
// Router for forkooor utils

const express = require("express");
const { createNewFork, topUpOwner, setUpBotAccounts, cloneFork, topUpAccount, setBalance, timeTravel } = require("../../helpers/utils/general");

const router = express.Router();

/**
 * @swagger
 * /utils/general/new-fork:
 *   post:
 *     summary: Returns forkId of the Tenderly fork created using given parameters
 *     tags:
 *      - Utils
 *     description: Creates a Tenderly fork in a desired tenderly project, using provided access key, on network matching given chainId and sets up bot accounts if given
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              tenderlyProject:
 *                type: string
 *                example: strategies
 *              tenderlyAccessKey:
 *                type: string
 *                example: lkPK1hfSngkKFDumvCvbkK6XVF5tmKey
 *              chainId:
 *                type: integer
 *                example: 1
 *              botAccounts:
 *                type: array
 *                items:
 *                 type: string
 *                 example: "0x000000000000000000000000000000000000dEaD"
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
 *                   example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
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
router.post("/new-fork", async (req, res) => {
    let resObj;

    try {
        const { tenderlyProject, tenderlyAccessKey, chainId, botAccounts } = req.body;

        const forkId = await createNewFork(tenderlyProject, tenderlyAccessKey, chainId);

        await topUpOwner(forkId);
        await setUpBotAccounts(forkId, botAccounts);

        resObj = { forkId };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: "Failed to create a new fork" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /utils/general/clone-fork:
 *   post:
 *     summary: Returns forkId of the Tenderly fork cloned from an existing fork
 *     tags:
 *      - Utils
 *     description: Creates a Tenderly fork by cloning an already existing fork in the same project as provided, using the same access key and sets up bot accounts if given
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              tenderlyProject:
 *                type: string
 *                example: strategies
 *              tenderlyAccessKey:
 *                type: string
 *                example: lkPK1hfSngkKFDumvCvbkK6XVF5tmKey
 *              cloningForkId:
 *                type: string
 *                example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
 *              botAccounts:
 *                type: array
 *                items:
 *                 type: string
 *                 example: "0x000000000000000000000000000000000000dEaD"
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
 *                   example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
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
router.post("/clone-fork", async (req, res) => {
    let resObj;

    try {
        const { cloningForkId, tenderlyProject, tenderlyAccessKey, botAccounts } = req.body;

        const forkId = await cloneFork(cloningForkId, tenderlyProject, tenderlyAccessKey);

        await topUpOwner(forkId);
        await setUpBotAccounts(forkId, botAccounts);
        resObj = { forkId };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: "Failed to clone a fork" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /utils/general/set-bot-auth:
 *   post:
 *     summary: Sets up bot accounts
 *     tags:
 *      - Utils
 *     description: Sets up bot accounts by  iving them ETH and adding them as bot caller on BotAuth contract
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
 *                example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
 *              botAccounts:
 *                type: array
 *                items:
 *                 type: string
 *                 example: "0x000000000000000000000000000000000000dEaD"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 botAccounts:
 *                   type: array
 *                   items:
 *                    type: string
 *                    example: "0x000000000000000000000000000000000000dEaD"
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
router.post("/set-bot-auth", async (req, res) => {
    let resObj;

    try {
        const { forkId, botAccounts } = req.body;

        await topUpOwner(forkId);
        await setUpBotAccounts(forkId, botAccounts);

        resObj = { botAccounts };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: "Failed to set both auth" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /utils/general/set-eth-balance:
 *   post:
 *     summary: Sets eth balance of a given address to requested amount
 *     tags:
 *      - Utils
 *     description: Sets eth balance of a given address to requested amount
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
 *                example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
 *              account:
 *                type: string
 *                example: "0x000000000000000000000000000000000000dEaD"
 *              amount:
 *                type: integer
 *                example: 100
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: string
 *                   example: "0x000000000000000000000000000000000000dEaD"
 *                 amount:
 *                   type: integer
 *                   example: 100
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
router.post("/set-eth-balance", async (req, res) => {
    let resObj;

    try {
        const { forkId, account, amount } = req.body;

        await topUpAccount(forkId, account, amount);
        resObj = {
            account,
            amount
        };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: "Failed to set ETH balance" };
        res.status(500).send(resObj, err);
    }
});

/**
 * @swagger
 * /utils/general/set-token-balance:
 *   post:
 *     summary: Sets token balance of a given address to requested amount
 *     tags:
 *      - Utils
 *     description: Sets token balance (ERC20) of a given address to requested amount
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
 *                example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
 *              token:
 *                type: string
 *                example: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *              account:
 *                type: string
 *                example: "0x000000000000000000000000000000000000dEaD"
 *              amount:
 *                type: integer
 *                example: 100
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *                 account:
 *                   type: string
 *                   example: "0x000000000000000000000000000000000000dEaD"
 *                 amount:
 *                   type: integer
 *                   example: 100
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
router.post("/set-token-balance", async (req, res) => {
    let resObj;

    try {
        const { forkId, token, account, amount } = req.body;

        await setBalance(forkId, token, account, amount);
        resObj = {
            token,
            account,
            amount
        };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: err.toString() };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/time-travel:
 *   post:
 *     summary: Increases the timestamp on a fork by a given amount
 *     tags:
 *      - Utils
 *     description: Increases the timestamp on a fork by a given amount
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
 *                example: 1efe2071-7c28-4853-8b93-7c7959bb3bbd
 *              amount:
 *                type: integer
 *                example: 10000000
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 oldTimestamp:
 *                   type: integer
 *                   example: 1679424065
 *                 newTimestamp:
 *                   type: integer
 *                   example: 1689424065
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
router.post("/time-travel", async (req, res) => {
    let resObj;

    try {
        const { forkId, amount } = req.body;

        resObj = await timeTravel(forkId, amount);
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: "Failed to time travel" };
        res.status(500).send(resObj, err);
    }
});

module.exports = router;