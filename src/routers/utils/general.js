/* eslint-disable jsdoc/check-tag-names */
// Router for forkooor utils

const express = require("express");
const { createNewFork, topUpOwner, setUpBotAccounts, cloneFork, topUpAccount, timeTravel, newAddress, createNewVnet, setTime } = require("../../helpers/utils/general");
const { setBalance, setupFork, lowerSafesThreshold, approve, createSafe, getProxy } = require("../../utils");

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

        const { forkId, newAccount, blockNumber } = await createNewFork(tenderlyProject, tenderlyAccessKey, chainId);

        await setupFork(forkId);
        await topUpOwner(forkId);
        await setUpBotAccounts(forkId, botAccounts);

        resObj = { forkId, newAccount, blockNumber };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to create a new fork with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/new-vnet:
 *   post:
 *     summary: Returns forkId of the Tenderly virtual testnet (vnet) created using given parameters
 *     tags:
 *      - Utils
 *     description: Creates a Tenderly virtual testnet in a desired tenderly project, using provided access key, on network matching given chainId and top up bot accounts or regular accounts if provided
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
 *                example: ["0x000000000000000000000000000000000000dEaD", "0x1111111111111111111111111111111111111111"]
 *              accounts:
 *                type: array
 *                items:
 *                 type: string
 *                example: ["0x2222222222222222222222222222222222222222"]
 *              startFromBlock:
 *                type: integer
 *                example: 18500000
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
 *                 newAccount:
 *                   type: string
 *                   example: "0x3333333333333333333333333333333333333333"
 *                 blockNumber:
 *                   type: integer
 *                   example: 18500000
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
router.post("/new-vnet", async (req, res) => {
    let resObj;

    try {
        const {
            tenderlyProject,
            tenderlyAccessKey,
            chainId,
            botAccounts = [],
            accounts = [],
            startFromBlock,
        } = req.body;

        const { forkId, newAccount, blockNumber } = await createNewVnet(tenderlyProject, tenderlyAccessKey, chainId, startFromBlock);

        if (botAccounts?.length > 0) {
            await setupFork(forkId, [], true);
            await topUpOwner(forkId);
            await setUpBotAccounts(forkId, botAccounts, true);
        } else if (accounts?.length > 0) {
            await setupFork(forkId, [], true);
            await topUpAccount(accounts[0]);
        }

        resObj = { forkId, newAccount, blockNumber };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to create a new fork with error : ${err.toString()}` };
        res.status(500).send(resObj);
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

        await setupFork(forkId);
        await topUpOwner(forkId);
        await setUpBotAccounts(forkId, botAccounts);

        resObj = { forkInfoObject };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to clone a fork with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/set-bot-auth:
 *   post:
 *     summary: Sets up bot accounts
 *     tags:
 *      - Utils
 *     description: Sets up bot accounts by giving them ETH and adding them as bot caller on BotAuth contract
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              isVnet:
 *                type: boolean
 *                example: true
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
        const { forkId, botAccounts, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);
        await topUpOwner();
        await setUpBotAccounts(forkId, botAccounts, isVnet);

        resObj = { botAccounts };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to set bot auth with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/set-safe-thresholds:
 *   post:
 *     summary: Lowers safe threshold to 1 for a list of safes
 *     tags:
 *      - Utils
 *     description: Lowers safe threshold to 1 for a list of safes
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              isVnet:
 *                type: boolean
 *                example: true
 *              safes:
 *                type: array
 *                items:
 *                 type: string
 *                 example: "0x000000000000000000000000000000000000dEaD"
 *              thresholds:
 *                type: array
 *                items:
 *                 type: number
 *                 example: 1
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 safes:
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
router.post("/set-safe-thresholds", async (req, res) => {
    let resObj;

    try {
        const { forkId, safes, thresholds, isVnet = false } = req.body;

        if (safes.length !== thresholds.length) {
            throw new Error("Arrays not the same size");
        }

        await lowerSafesThreshold(forkId, safes, thresholds, isVnet);

        resObj = { safes };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to set threshold auth with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              isVnet:
 *                type: boolean
 *                example: true
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
        const { forkId, account, amount, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);
        await topUpAccount(account, amount);
        resObj = {
            account,
            amount
        };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to set eth balance with error : ${err.toString()}` };
        res.status(500).send(resObj);
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              isVnet:
 *                type: boolean
 *                example: true
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
        const { forkId, token, account, amount, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);
        await setBalance(token, account, amount);
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
 * /utils/general/give-approval:
 *   post:
 *     summary: Give token approval from owner to given address
 *     tags:
 *      - Utils
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
 *              owner:
 *                type: string
 *                example: "0x000000000000000000000000000000000000dEaD"
 *              to:
 *                type: string
 *                example: "0x000000000000000000000000000000000000dEaD"
 *              isProxyApproval:
 *                type: boolean
 *                example: true
 *              proxyAddr:
 *                type: string
 *                example: "0x000000000000000000000000000000000000dEaD"
 *                description: Address of the proxy contract if isProxyApproval is true
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
 *                 owner:
 *                   type: string
 *                   example: "0x000000000000000000000000000000000000dEaD"
 *                 giveApprovalTo:
 *                   type: string
 *                   example: "0x000000000000000000000000000000000000dEaD"
 *                 isProxyApproval:
 *                   type: boolean
 *                   example: true
 *                 proxyAddr:
 *                   type: string
 *                   example: "0x000000000000000000000000000000000000dEaD"
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
router.post("/give-approval", async (req, res) => {
    let resObj;

    try {
        const { forkId, token, owner, to, isProxyApproval, proxyAddr } = req.body;


        const giveApprovalTo = isProxyApproval ? proxyAddr : to;

        await approve(token, giveApprovalTo, owner);

        resObj = {
            token,
            owner,
            giveApprovalTo,
            isProxyApproval
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              amount:
 *                type: integer
 *                example: 10000000
 *              isVnet:
 *                type: boolean
 *                example: true
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
        const { forkId, amount, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);
        resObj = await timeTravel(forkId, amount, isVnet);
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to time travel with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/new-address:
 *   get:
 *     summary: Returns new Ethereum address.
 *     tags:
 *      - Utils
 *     description: Returns new Ethereum address.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "0xc78E09653fb412264321653468bF56244D00153E"
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
router.get("/new-address", async (req, res) => {
    let resObj;

    try {
        resObj = await newAddress();
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to create new address with error : ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/create-safe:
 *   post:
 *     summary: Creates new Safe Smart Wallet
 *     tags:
 *      - Utils
 *     description: Returns new Safe Smart Wallet address.
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              isVnet:
 *                type: boolean
 *                example: true
 *              owner:
 *                type: string
 *                example: "0xc78E09653fb412264321653468bF56244D00153E"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "0xc78E09653fb412264321653468bF56244D00153E"
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
router.post("/create-safe", async (req, res) => {
    let resObj;

    try {
        const { forkId, owner, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);

        resObj = await createSafe(owner);
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to create safe smart wallet: ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

/**
 * @swagger
 * /utils/general/set-time:
 *   post:
 *     summary: Sets the timestamp on a fork to a specific value
 *     tags:
 *      - Utils
 *     description: Sets the timestamp on a fork to a specific value, allowing movement forward or backward in time
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
 *                example: "https://virtual.mainnet.rpc.tenderly.co/9b8557b8-8bb4-46e7-90e1-de0918cb8c2e"
 *              timestamp:
 *                type: integer
 *                example: 1679424065
 *                description: Unix timestamp to set the blockchain time to
 *              isVnet:
 *                type: boolean
 *                example: true
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
router.post("/set-time", async (req, res) => {
    let resObj;

    try {
        const { forkId, timestamp, isVnet } = req.body;

        await setupFork(forkId, [], isVnet);
        resObj = await setTime(forkId, timestamp, isVnet);

        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to set time with error: ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
