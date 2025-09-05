const videoService = require("../services/videoService.js");

exports.getAllVideos = async (req, res, next) => {
  try {
     
    res.status(200).json({
      status: "success",
      data: { "test":"result" },
    });
  } catch (err) {
    next(err);
  }
};



exports.createVideo = async (req, res, next) => {
  try {
    console.log(req.body);
    const {videoData, outputFileName}  = req.body;
    const newVideo = await videoService.createVideo(videoData, outputFileName);
    if(newVideo?.status === "success"){
      res.status(201).json({
        ...newVideo
      });
    } else {
      res.status(500).json({
        ...newVideo
      });
    }
    
  } catch (err) {
    next(err);
  }
};
/*exports.getVideoById = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { video },
    });
  } catch (err) {
    next(err);
  }
};
exports.updateVideo = async (req, res, next) => {
  try {
    const video = await videoService.updateVideo(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: { video },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    await videoService.deleteVideo(req.params.id);
    res.status(204).json({
      status: "success",
      message: "video deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
*/