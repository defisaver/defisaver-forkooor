const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const cors = require("cors");

const generalRouter = require("./src/routers/utils/index");
const makerRouter = require("./src/routers/maker/index");
const sparkRouter = require("./src/routers/spark/index");
const liquityRouter = require("./src/routers/liquity/index");
const aaveV3Router = require("./src/routers/aavev3/index");
const curveusdRouter = require("./src/routers/curveusd/index");
const compoundV3Router = require("./src/routers/compoundV3/index");
const morphoBlueRouter = require("./src/routers/morpho-blue/index");
const liquityV2Router = require("./src/routers/liquityV2/index");
const fluidRouter = require("./src/routers/fluid/index");
const aaveV4Router = require("./src/routers/aaveV4/index");

const app = express();

app.use(cors());
app.use(express.json({ extended: true }));

app.use("/v1/utils", generalRouter);
app.use("/v1/maker", makerRouter);
app.use("/v1/spark", sparkRouter);
app.use("/v1/liquity", liquityRouter);
app.use("/v1/aave/v3", aaveV3Router);
app.use("/v1/curveusd", curveusdRouter);
app.use("/v1/compound/v3", compoundV3Router);
app.use("/v1/morpho-blue", morphoBlueRouter);
app.use("/v1/liquity/v2", liquityV2Router);
app.use("/v1/fluid", fluidRouter);
app.use("/v1/aave/v4", aaveV4Router);

app.use("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});
app.use("/v1", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = 3000;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

// / TODO: folder and files for util functions
// / TODO: split helpers utils into view (getters), strategy sub specifics, and state changing
// / TODO: README file for adding new routers/functions/endpoints etc.
// / TODO: Throw error and 500 when tx fails
