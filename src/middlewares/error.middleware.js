const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      detail: err.details.map(detail => detail.message),
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      code: 'NOT_FOUND',
      message: err.message,
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: err.message,
    });
  }

  // Default error
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
};

module.exports = errorHandler;
