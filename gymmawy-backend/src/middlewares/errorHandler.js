export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || undefined;
  
  // Always expose the message if it's explicitly marked as expose or if it's a client error (4xx)
  const message = err.expose || status < 500 ? err.message : "Internal server error";
  const details = err.details || undefined;
  const validationErrors = err.validationErrors || undefined;
  
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  
  const response = { 
    error: { 
      message, 
      code,
      status 
    } 
  };
  
  if (details) {
    response.error.details = details;
  }
  
  if (validationErrors) {
    response.error.validationErrors = validationErrors;
  }
  
  res.status(status).json(response);
}

