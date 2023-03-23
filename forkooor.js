const express = require('express')
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const generalRouter = require("./src/routers/utils/index");
const makerRouter = require("./src/routers/maker/index");

require('dotenv-safe').config();


const app = express();
app.use(express.json({extended: true}))

app.use("/utils", generalRouter);
app.use("/maker", makerRouter);

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const port = process.env.PORT || 3000;

app.listen(port, () => console.log('App listening on port ' + port));