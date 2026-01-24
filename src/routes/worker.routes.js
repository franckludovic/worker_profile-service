const express = require('express');
const router = express.Router();

const workerController = require('../controllers/worker.controller');
const auth = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');
const { checkOwnership } = require('../middlewares/ownership.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const createWorkerSchema = require('../validators/createWorker.schema');
const updateWorkerSchema = require('../validators/updateWorker.schema');

// List worker profiles
router.get('/workers', authenticate, workerController.listWorkerProfiles);

// Create worker profile
router.post('/workers', authenticate, validateRequest(createWorkerSchema), workerController.createWorkerProfile);

// Get worker profile
router.get('/workers/:worker_id', authenticate, workerController.getWorkerProfile);

// Update worker profile
router.patch(
  '/workers/:worker_id',
  authenticate,
  checkOwnership,
  validateRequest(updateWorkerSchema),
  workerController.updateWorkerProfile
);

// Delete worker profile
router.delete('/workers/:worker_id', authenticate, checkOwnership, workerController.deleteWorkerProfile);

module.exports = router;
