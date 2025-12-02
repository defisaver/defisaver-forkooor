# DeFi Saver Forkooor

App that opens endpoints to manage Tenderly Forks and execute DeFi Saver actions and recipes on those forks.

## Running

To run this project:

```bash
  npm i
  # change port variable in forkooor.js
  npm run dev
```

At '/' endpoint there's Swagger docs for each available endpoint

## Contributing

How to create new endpoints by example:

Adding Liquity to Forkooor.js

1. Create /src/routers/liquity subfolder, with general.js, strategies.js and index.js files.

- /src/routers/liquity/general.js should have endpoints for manipulating Liquity troves (Open, Supply, Borrow, Payback, Withdraw, Close etc..)
- /src/routers/liquity.strategies.js should have endpoints for subbing to Liquity strategies (Close, Boost/Repay etc..)
- /src/routers/liquity/index.js should just export all Liquity endpoints from one place
  Endpoints should follow this structure:

```bash
  /swagger-docs
  router.post("/route-name", async (req, res) => {
    let resObj;

    try {
        const { vnetId, ...params } = req.body;

        await setupFork(vnetId, [owner]);
        await executeEndpointAction()

        res.status(200).send();
    } catch (err) {
        resObj = { error: `Error message` };
        res.status(500).send(resObj);
    }
});
```

2. Create /src/helpers/liquity subfolder, with general.js, strategies.js, view.js etc. files.

- /src/helpers/liquity/general.js should have actions that directly manipulate Liquity Vaults (by using defisaver/sdk)
- /src/helpers/liquity/strategies.js should only have actions that subscribe to an existing strategy (by using defisaver/automation-sdk)
- /src/helpers/liquity/view.js should only call view functions and fetch information from chain (forks)
- If any function isn't Liquity specific but is needed it should go in src/utils.js
- If any contracts ABI is needed, it's added to src/abi folder in matching subfolder

