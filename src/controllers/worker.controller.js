const workerService = require('../services/worker.service');

const listWorkerProfiles = async (req, res) => {
  const { categories, active, limit, offset } = req.query;
  const filters = { categories: categories ? categories.split(',') : undefined, active: active === 'true' };
  const pagination = { limit: parseInt(limit) || 10, offset: parseInt(offset) || 0 };

  const result = await workerService.listWorkerProfiles(filters, pagination);
  res.json(result);
};

const createWorkerProfile = async (req, res) => {
  const profileData = req.body;
  const userId = req.user.id; // Assuming user info from auth middleware
  const profile = await workerService.createWorkerProfile(userId, profileData);
  res.status(201).json(profile);
};

const getWorkerProfile = async (req, res) => {
  const { worker_id } = req.params;
  const profile = await workerService.getWorkerProfile(worker_id);
  res.json(profile);
};

const updateWorkerProfile = async (req, res) => {
  const { worker_id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const profile = await workerService.updateWorkerProfile(worker_id, updateData, userId, userRole);
  res.json(profile);
};

const deleteWorkerProfile = async (req, res) => {
  const { worker_id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  await workerService.deleteWorkerProfile(worker_id, userId, userRole);
  res.status(204).send();
};

module.exports = {
  listWorkerProfiles,
  createWorkerProfile,
  getWorkerProfile,
  updateWorkerProfile,
  deleteWorkerProfile,
};
