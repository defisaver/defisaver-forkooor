const express = require('express')

const generalRouter = require("./general");

const router = express.Router();

router.use("/general", generalRouter);

module.exports = router;