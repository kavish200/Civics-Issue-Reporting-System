const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  const status = err.status || (err instanceof multer.MulterError
    ? err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    : 500);
  const message = err.message || 'Internal server error';
  res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
};

module.exports = errorHandler;
