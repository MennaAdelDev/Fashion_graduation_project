const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Unexpected server error';
  let details;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err && err.type === 'entity.parse.failed') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Malformed JSON body';
  } else if (err && err.type === 'entity.too.large') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request body is too large';
  } else {
    console.error(err);
  }

  const error = { code, message };
  if (details) error.details = details;
  return res.status(status).json({ error });
}

module.exports = { notFound, errorHandler };
