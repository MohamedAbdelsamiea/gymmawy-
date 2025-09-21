export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || undefined;
  const message = err.expose ? err.message : status >= 500 ? "Internal server error" : err.message;
  const details = err.details || undefined;
  
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  
  const response = { error: { message, code } };
  if (details) {
    response.details = details;
  }
  
  res.status(status).json(response);
}

