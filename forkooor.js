const express = require('express')
require('dotenv-safe').config();

const utilsRouter = require("./routers/utils-router");

const app = express();
app.use(express.json({extended: true}))
app.use("/utils", utilsRouter);

app.get('/', (req, res) => {
    res.send('Hello');
    // point to docs, have a list of endpoints
})


const port = process.env.PORT || 3000;

app.listen(port, () => console.log('App listening on port ' + port));