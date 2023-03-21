// Router for forkooor utils

const express = require("express");
const { createNewFork, topUpOwner, setUpBotAccounts, cloneFork, topUpAccount, setBalance, timeTravel } = require("../helpers/general");

const router = express.Router();

// TODO: folder and files for util functions
// TODO: split helpers utils into view (getters), strategy sub specifics, and state changing
// TODO: README file for adding new routers/functions/endpoints etc.

/**
 * @swagger
 * /general/new-fork:
 *   post:
 *     summary: Returns forkId of the Tenderly fork created using given parameters
 *     tags:
 *      - general
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
        const { tenderlyProject, tenderlyAccessKey, chainId, botAccounts} = req.body;

        const forkId = await createNewFork(tenderlyProject, tenderlyAccessKey, chainId);
        await topUpOwner(forkId, tenderlyProject, tenderlyAccessKey);
        await setUpBotAccounts(forkId, tenderlyProject, tenderlyAccessKey, botAccounts);

        resObj = { "forkId" : forkId };
        res.status(200).send(resObj);
    } catch(err){
        resObj = { "error" : "Failed to create a new fork" };
        res.status(500).send(resObj); 
    }
});

router.post("/clone-fork", async (req, res) => {
    try {
        const { cloningForkId, tenderlyAccessKey, botAccounts} = req.body;

        const forkId = await cloneFork(cloningForkId, tenderlyAccessKey)
        await topUpOwner(forkId, tenderlyAccessKey);
        await setUpBotAccounts(forkId, tenderlyAccessKey, botAccounts);
        res.send(forkId);
    } catch(err){
        res.status(500);
        res.send(err); 
    }
});

router.post("/set-bot-auth", async (req, res) => {
    try {
        const { forkId, tenderlyAccessKey, botAccounts} = req.body;

        await topUpOwner(forkId, tenderlyAccessKey);
        await setUpBotAccounts(forkId, tenderlyAccessKey, botAccounts);
        res.send("Success");
    } catch(err){
        res.status(500);
        res.send(err); 
    }
});

router.post("/set-eth-balances", async (req, res) => {
    try{
        const { forkId, tenderlyAccessKey, account, amount} = req.body;

        await topUpAccount(forkId, tenderlyAccessKey, account, amount);
        res.send("Success");
    } catch(err){
        res.status(500);
        res.send(err); 
    }
});

router.post("/set-token-balances", async (req, res) => {
    let balanceResponse = "Unknown error"
    try{
        const { forkId, tenderlyAccessKey, token, account, amount} = req.body;

        balanceResponse = await setBalance(forkId, tenderlyAccessKey, token, account, amount);
        res.send("Success");
    } catch(err){
        console.log(err);
        res.status(500).send(err, balanceResponse);
    }
});


router.post("/time-travel", async (req, res) => {
    try{
        const { forkId, amount} = req.body;

        await timeTravel(forkId, amount);
        res.send("Success");
    } catch(err){
        res.status(500);
        res.send(err); 
    }
});

module.exports = router;