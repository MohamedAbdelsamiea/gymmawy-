import { 
  getContentService, 
  updateContentService,
  getTransformationsService,
  createTransformationService,
  getTransformationByIdService,
  updateTransformationService,
  deleteTransformationService,
  getVideosService,
  createVideoService,
  getVideoByIdService,
  updateVideoService,
  deleteVideoService
} from './cms.service.js';

export const getContent = async (req, res) => {
  try {
    const content = await getContentService();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await updateContentService(id, req.body);
    res.json(content);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Transformations
export const getTransformations = async (req, res) => {
  try {
    const { isActive, language, pageSize, sortBy, sortOrder } = req.query;
    const transformations = await getTransformationsService({
      isActive: isActive ? isActive === 'true' : undefined,
      language,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      sortBy,
      sortOrder
    });
    res.json({ transformations });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createTransformation = async (req, res) => {
  try {
    const transformation = await createTransformationService(req.body);
    res.status(201).json({ transformation });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getTransformationById = async (req, res) => {
  try {
    const { id } = req.params;
    const transformation = await getTransformationByIdService(id);
    if (!transformation) return res.status(404).json({ error: { message: "Transformation not found" } });
    res.json({ transformation });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateTransformation = async (req, res) => {
  try {
    const { id } = req.params;
    const transformation = await updateTransformationService(id, req.body);
    res.json({ transformation });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteTransformation = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTransformationService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Videos
export const getVideos = async (req, res) => {
  try {
    const videos = await getVideosService();
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createVideo = async (req, res) => {
  try {
    const video = await createVideoService(req.body);
    res.status(201).json({ video });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoByIdService(id);
    if (!video) return res.status(404).json({ error: { message: "Video not found" } });
    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await updateVideoService(id, req.body);
    res.json({ video });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
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
