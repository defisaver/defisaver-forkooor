const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.send("strategies");

    // point to docs, have a list of endpoints
});

module.exports = router;
