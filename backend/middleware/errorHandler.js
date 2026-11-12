function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({
    error: error.expose ? error.message : 'Something went wrong on the server.'
  });
}

module.exports = errorHandler;
