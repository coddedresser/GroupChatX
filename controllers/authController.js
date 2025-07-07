const User = require('../models/User');

// GET Register
exports.getRegister = (req, res) => {
  res.render('auth/register');
};

// POST Register
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'lcnsldgmlsm';

exports.postRegister = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
};


// GET Login
exports.getLogin = (req, res) => {
  res.render('auth/login');
};

// POST Login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.redirect('/login');
    }
    req.user = user;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

