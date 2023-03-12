// Router for forkooor utils

const express = require("express");
const axios = require('axios');
const { headers, topUpBotAccounts, topUpOwner, topUpAccount, getChainId, setBalance } = require("../utils");

const router = express.Router();

router.post("/new-fork", async (req, res) => {
    const {chainId, botAccounts} = req.body;

    const body = { network_id: chainId };
    const forkRes = await axios.post('https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/fork', body, { headers });

    const forkId = forkRes.data.simulation_fork.id;
    await topUpBotAccounts(botAccounts, chainId, forkId);
    await topUpOwner(chainId, forkId);
    res.send(forkId);
});

router.post("/clone-fork", async (req, res) => {
    const {cloneForkId, botAccounts} = req.body;

    const url = 'https://api.tenderly.co/api/v1/account/defisaver-v2/project/strategies/clone-fork'
    
    const body = { fork_id : cloneForkId};
    const forkRes = await axios.post(url, body, { headers });

    const forkId = forkRes.data.simulation_fork.id;
    const chainId = forkRes.data.simulation_fork.network_id;
    await topUpBotAccounts(botAccounts, chainId, forkId);
    await topUpOwner(chainId, forkId);
    res.send(forkId);
});

router.post("/set-both-auth", async (req, res) => {
    const {forkId, botAccounts} = req.body;

    const chainId = await getChainId(forkId);

    await topUpBotAccounts(botAccounts, chainId, forkId);
    await topUpOwner(chainId, forkId);
    res.send("Success");
});

router.post("/gib-money", async (req, res) => {
    const {forkId, accounts} = req.body;
    for (let i = 0; i < accounts.length; i++){
        await topUpAccount(accounts[i], forkId);
    }
    res.send("Success");
})

router.post("/gib-tokens", async (req, res) => {
    console.log("HERE")
    const { forkId, accounts, tokens, amounts} = req.body;
    

    for (let i = 0; i < accounts.length; i++){
        for (let j = 0; j < tokens.length; j++) {
            await setBalance(tokens[j], accounts[i], amounts[j], forkId);
        }
    }
    res.send("success");
})
router.get('/', (req, res) => {
    res.send('Hello2');
    // point to docs, have a list of endpoints
})

module.exports = router;