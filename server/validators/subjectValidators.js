const { body } = require('express-validator');

const subjectValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Subject name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex value')
];

module.exports = { subjectValidator };
