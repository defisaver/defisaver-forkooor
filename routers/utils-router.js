// Router for forkooor utils

const express = require("express");
const axios = require('axios');
const { headers, topUpBotAccounts, topUpOwner } = require("../utils");

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

module.exports = router;