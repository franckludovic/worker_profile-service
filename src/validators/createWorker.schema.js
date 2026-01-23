const Joi = require('joi');

const createWorkerSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  name: Joi.string().required(),
  categories: Joi.array().items(Joi.string()).min(1).required(),
  bio: Joi.string().required(),
  experienceYears: Joi.number().integer().min(0).optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  baseLocation: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    lat: Joi.number().required(),
    lon: Joi.number().required(),
  }).optional(),
  serviceAreas: Joi.array().items(Joi.object({
    city: Joi.string().required(),
    note: Joi.string().optional(),
  })).optional(),
  travelRadiusKm: Joi.number().min(0).optional(),
  active: Joi.boolean().optional(),
});

module.exports = createWorkerSchema;
