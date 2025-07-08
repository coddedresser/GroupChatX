const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SECRET_KEY = 'lcnsldgmlsm';

// GET Register page
router.get('/',authController.getLogin)
router.get('/register', authController.getRegister);

// POST Register
router.post('/register', authController.postRegister);

// GET Login page
router.get('/login', authController.getLogin);

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).render('login', { error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, {
    expiresIn: '1h',
  });

  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
