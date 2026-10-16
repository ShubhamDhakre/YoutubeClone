const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      let statusCode = err.statusCode;
      if (!statusCode || typeof statusCode !== "number" || statusCode < 100 || statusCode > 599) {
        if (err.code === 11000) {
          statusCode = 409;
        } else if (typeof err.code === "number" && err.code >= 100 && err.code <= 599) {
          statusCode = err.code;
        } else {
          statusCode = 500;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: err.message || "Something went wrong",
        errors: err.errors || []
      });
    }
  };
};

export { asyncHandler };