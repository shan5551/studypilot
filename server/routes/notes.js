const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  toggleFavorite,
  deleteNote
} = require('../controllers/noteController');

router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
