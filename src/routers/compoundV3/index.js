const express = require("express");

const generalRouter = require("./general");
const strategiesRouter = require("./strategies");

const router = express.Router();

router.use("/general", generalRouter);
router.use("/strategies", strategiesRouter);

module.exports = router;
