function validate(fields = []) {
  return (req, res, next) => {
    const errors = [];
    fields.forEach((field) => {
      const value = req.body[field.name];
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.name} is required`);
      }
      if (value !== undefined && value !== null && field.validate && !field.validate(value)) {
        errors.push(field.errorMessage || `${field.name} is invalid`);
      }
    });

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

module.exports = { validate };
