const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { subjectValidator } = require('../validators/subjectValidators');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getSubjects)
  .post(subjectValidator, validate, createSubject);

router.route('/:id')
  .get(getSubject)
  .put(subjectValidator, validate, updateSubject)
  .delete(deleteSubject);

module.exports = router;
