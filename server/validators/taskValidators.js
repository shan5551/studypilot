const { body } = require('express-validator');

const taskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Task title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('estimatedMinutes')
    .optional()
    .isInt({ min: 0 }).withMessage('Estimated time must be a positive number')
];

module.exports = { taskValidator };
