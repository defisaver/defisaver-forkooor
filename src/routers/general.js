// Router for forkooor utils

const express = require("express");
const { createNewFork, topUpOwner, setUpBotAccounts, cloneFork, topUpAccount, setBalance, timeTravel } = require("../helpers/general");

const router = express.Router();

// TODO: folder and files for util functions
// TODO: split helpers utils into view (getters), strategy sub specifics, and state changing
// TODO: README file for adding new routers/functions/endpoints etc.

router.post("/new-fork", async (req, res) => {
    try {
        const { tenderlyAccessKey, chainId, botAccounts} = req.body;

        const forkId = await createNewFork(tenderlyAccessKey, chainId);
        await topUpOwner(forkId, tenderlyAccessKey);
        await setUpBotAccounts(forkId, tenderlyAccessKey, botAccounts);
        res.send(forkId);
    } catch(err){
        res.status(500);
        res.send(err);    
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
    try{
        const { forkId, tenderlyAccessKey, token, account, amount} = req.body;

        const balanceResponse = await setBalance(forkId, tenderlyAccessKey, token, account, amount);
        res.send("Success");
    } catch(err){
        res.status(500);
        res.send(err, balanceResponse); 
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