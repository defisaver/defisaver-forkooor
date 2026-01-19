/* eslint-disable jsdoc/check-tag-names */
// Router for forkooor utils

const express = require("express");
const { topUpOwner, setUpBotAccounts, topUpAccount, timeTravel, newAddress, createNewVnet, setTime } = require("../../helpers/utils/general");
const { setBalance, setupVnet, lowerSafesThreshold, approve, createSafe } = require("../../utils");

const router = express.Router();

/**
 * @swagger
 * /utils/general/new-vnet:
 *   post:
 *     summary: Returns vnetUrl of the Tenderly virtual testnet (vnet) created using given parameters
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
 *                 vnetUrl:
 *                   type: string
 *                   example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
            startFromBlock
        } = req.body;

        const { vnetUrl, newAccount, blockNumber } = await createNewVnet(tenderlyProject, tenderlyAccessKey, chainId, startFromBlock);

        if (botAccounts.length > 0) {
            await setupVnet(vnetUrl, []);
            await topUpOwner();
            await setUpBotAccounts(vnetUrl, botAccounts);
        } else if (accounts.length > 0) {
            await setupVnet(vnetUrl, []);
            await topUpAccount(accounts[0]);
        }

        resObj = { vnetUrl, newAccount, blockNumber };
        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to create a new vnet with error : ${err.toString()}` };
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, botAccounts } = req.body;

        await setupVnet(vnetUrl, []);
        await topUpOwner();
        await setUpBotAccounts(vnetUrl, botAccounts);

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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, safes, thresholds } = req.body;

        if (safes.length !== thresholds.length) {
            throw new Error("Arrays not the same size");
        }

        await lowerSafesThreshold(vnetUrl, safes, thresholds);

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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, account, amount } = req.body;

        await setupVnet(vnetUrl, []);
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, token, account, amount } = req.body;

        await setupVnet(vnetUrl, []);
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { token, owner, to, isProxyApproval, proxyAddr } = req.body;


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
 *     summary: Increases the timestamp on a vnet by a given amount
 *     tags:
 *      - Utils
 *     description: Increases the timestamp on a vnet by a given amount
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, amount } = req.body;

        await setupVnet(vnetUrl, []);
        resObj = await timeTravel(vnetUrl, amount);
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
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
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
        const { vnetUrl, owner } = req.body;

        await setupVnet(vnetUrl, []);

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
 *     summary: Sets the timestamp on a vnet to a specific value
 *     tags:
 *      - Utils
 *     description: Sets the timestamp on a vnet to a specific value, allowing movement forward or backward in time
 *     requestBody:
 *       description: Request body for the API endpoint
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              vnetUrl:
 *                type: string
 *                example: "https://virtual.mainnet.eu.rpc.tenderly.co/7aedef25-da67-4ef4-88f2-f41ce6fc5ea0"
 *              timestamp:
 *                type: integer
 *                example: 1679424065
 *                description: Unix timestamp to set the blockchain time to
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
        const { vnetUrl, timestamp } = req.body;

        await setupVnet(vnetUrl, []);
        resObj = await setTime(vnetUrl, timestamp);

        res.status(200).send(resObj);
    } catch (err) {
        resObj = { error: `Failed to set time with error: ${err.toString()}` };
        res.status(500).send(resObj);
    }
});

module.exports = router;
