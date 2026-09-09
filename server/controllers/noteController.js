const Note = require('../models/Note');

// @desc    Get all notes with filters
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const { search, subject, tag, favorite } = req.query;
    const query = { user: req.user._id };

    if (subject) query.subject = subject;
    if (tag) query.tags = tag;
    if (favorite === 'true') query.favorite = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query)
      .populate('subject', 'name color')
      .select('-attachments.data') // keep attachment metadata only; base64 stays on single-note fetches
      .sort({ updatedAt: -1 })
      .limit(parseInt(req.query.limit) || 200);

    res.json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id })
      .populate('subject', 'name color');
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @desc    Create note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      user: req.user._id,
      title: req.body.title || 'Untitled note',
      content: req.body.content || '',
      subject: req.body.subject || null,
      tags: req.body.tags || [],
      favorite: req.body.favorite || false
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @desc    Update note (autosave friendly)
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    let note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const allowed = ['title', 'content', 'subject', 'tags', 'favorite', 'summary'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite
// @route   PATCH /api/notes/:id/favorite
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    note.favorite = !note.favorite;
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB

// @desc    Attach a file (already base64-encoded in the JSON body)
// @route   POST /api/notes/:id/attachments
// @access  Private
const addAttachment = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const { name, type, size, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ success: false, error: 'name and data (base64) are required' });
    }
    if (size && size > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ success: false, error: 'File too large (max 8 MB)' });
    }

    note.attachments.push({
      name,
      type: type || 'application/octet-stream',
      size: size || 0,
      data
    });
    await note.save();

    const saved = note.attachments[note.attachments.length - 1];
    res.status(201).json({
      success: true,
      // return metadata only — keeps the upload response light
      attachment: {
        _id: saved._id,
        name: saved.name,
        type: saved.type,
        size: saved.size,
        addedAt: saved.addedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an attachment
// @route   DELETE /api/notes/:id/attachments/:attachId
// @access  Private
const removeAttachment = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    const before = note.attachments.length;
    note.attachments = note.attachments.filter((a) => String(a._id) !== req.params.attachId);
    if (note.attachments.length === before) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }
    await note.save();
    res.json({ success: true, message: 'Attachment removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotes, getNote, createNote, updateNote, toggleFavorite, deleteNote, addAttachment, removeAttachment };
