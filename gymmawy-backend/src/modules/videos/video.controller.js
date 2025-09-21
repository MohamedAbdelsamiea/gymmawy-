import { uploadVideoService, getVideosService, getVideoByIdService, deleteVideoService } from './video.service.js';

export const uploadVideo = async (req, res) => {
  try {
    const video = await uploadVideoService(req.body);
    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getVideos = async (req, res) => {
  try {
    const videos = await getVideosService();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoByIdService(id);
    if (!video) return res.status(404).json({ error: { message: "Video not found" } });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteVideoService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};
