const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Notice management routes
router.get(
  '/notices',
  adminController.getNotices
);


module.exports = router;