const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTask,
  deleteTask
} = require('../controllers/taskController');
const { taskValidator } = require('../validators/taskValidators');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(taskValidator, validate, createTask);

router.route('/:id')
  .get(getTask)
  .put(taskValidator, validate, updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTask);

module.exports = router;
