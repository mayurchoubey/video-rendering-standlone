const express = require("express");
const router = express.Router();
const videoRoutes = require("./videoRoutes");


router.use("/video", videoRoutes);

module.exports = router;
