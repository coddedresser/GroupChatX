const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const isAuthenticated=require('../middlewares/auth');
// Middleware to check if user is logged in
// function isAuthenticated(req, res, next) {
//   if (req.session.user) return next();
//   return res.redirect('/login');
// }

router.get('/', isAuthenticated, dashboardController.getDashboard);
router.post('/join', isAuthenticated, dashboardController.joinGroup);

module.exports = router;
