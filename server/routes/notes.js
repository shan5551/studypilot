const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  toggleFavorite,
  deleteNote,
  addAttachment,
  removeAttachment
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

// Attachments (base64 in JSON body; PDFs, images, diagrams)
router.post('/:id/attachments', addAttachment);
router.delete('/:id/attachments/:attachId', removeAttachment);

module.exports = router;
