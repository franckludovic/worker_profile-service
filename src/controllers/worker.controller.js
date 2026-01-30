const workerService = require('../services/worker.service');
const EventPublisher = require('../services/eventPublisher.service');

const listWorkerProfiles = async (req, res) => {
  const { categories, active, limit, offset } = req.query;
  const filters = { categories: categories ? categories.split(',') : undefined, active: active === 'true' };
  const pagination = { limit: parseInt(limit) || 10, offset: parseInt(offset) || 0 };

  const result = await workerService.listWorkerProfiles(filters, pagination);
  res.json(result);
};

const createWorkerProfile = async (req, res) => {
  const profileData = req.body;
  const userId = req.user.sub; 
  const profile = await workerService.createWorkerProfile(userId, profileData);

  // Publish worker created event
  await EventPublisher.publishEvent('worker.created', {
    workerId: profile.id,
    userId: userId,
    profileData: profileData,
    timestamp: new Date().toISOString()
  });

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
  const userId = req.user.sub;
  const userRole = req.user.role;
  const profile = await workerService.updateWorkerProfile(worker_id, updateData, userId, userRole);

  // Publish worker updated event
  await EventPublisher.publishEvent('worker.updated', {
    workerId: worker_id,
    userId: userId,
    updateData: updateData,
    timestamp: new Date().toISOString()
  });

  res.json(profile);
};

const deleteWorkerProfile = async (req, res) => {
  const { worker_id } = req.params;
  const userId = req.user.sub;
  const userRole = req.user.role;
  await workerService.deleteWorkerProfile(worker_id, userId, userRole);

  // Publish worker deleted event
  await EventPublisher.publishEvent('worker.deleted', {
    workerId: worker_id,
    userId: userId,
    timestamp: new Date().toISOString()
  });

  res.status(204).send();
};

const checkWorkerService = async (req, res) => {
  const { worker_id, service_id } = req.params;
  const result = await workerService.checkWorkerService(worker_id, service_id);
  res.json(result);
};

const filterWorkersByServices = async (req, res) => {
  const { services } = req.query;
  const serviceList = services ? services.split(',') : [];
  const result = await workerService.filterWorkersByServices(serviceList);
  res.json(result);
};

const getWorkerOwner = async (req, res) => {
  const { worker_id } = req.params;
  const result = await workerService.getWorkerOwner(worker_id);
  res.json(result);
};

module.exports = {
  listWorkerProfiles,
  createWorkerProfile,
  getWorkerProfile,
  updateWorkerProfile,
  deleteWorkerProfile,
  checkWorkerService,
  getWorkerOwner,
};
