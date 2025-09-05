const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

router
  .route("/")
  .get(videoController.getAllVideos)
  .post(videoController.createVideo);


module.exports = router;
