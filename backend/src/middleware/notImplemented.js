const AppError = require('../utils/AppError');

function notImplemented(sprint) {
  return (req, res, next) => {
    next(new AppError(501, 'NOT_IMPLEMENTED', `Endpoint contract is defined; implementation is planned for ${sprint}`));
  };
}

module.exports = notImplemented;
