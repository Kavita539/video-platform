const validate = (rules) => (req, res, next) => {
  const errors = [];

  for (const [field, checks] of Object.entries(rules)) {
    const value = req.body[field];

    if (checks.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== undefined && value !== '') {
      if (checks.minLength && String(value).length < checks.minLength) {
        errors.push(`${field} must be at least ${checks.minLength} characters`);
      }
      if (checks.maxLength && String(value).length > checks.maxLength) {
        errors.push(`${field} must be at most ${checks.maxLength} characters`);
      }
      if (checks.isEmail && !/^\S+@\S+\.\S+$/.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
      if (checks.isIn && !checks.isIn.includes(value)) {
        errors.push(`${field} must be one of: ${checks.isIn.join(', ')}`);
      }
    }
  }

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join('; ') });
  }
  next();
};

module.exports = { validate };
