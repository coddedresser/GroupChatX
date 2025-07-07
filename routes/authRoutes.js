const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET Register page
router.get('/register', authController.getRegister);

// POST Register
router.post('/register', authController.postRegister);

// GET Login page
router.get('/login', authController.getLogin);

// POST Login
router.post('/login', authController.postLogin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
