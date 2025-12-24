// middleware/runValidation.js
const { validationResult } = require("express-validator");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // สร้างรูปแบบ error ที่อ่านง่ายขึ้น
    const formatted = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      location: err.location
    }));

    return res.status(400).json({
      status: "validation_error",
      errors: formatted
    });
  }

  next();
};

module.exports = runValidation;
