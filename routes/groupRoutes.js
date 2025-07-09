const express = require('express');
const router=express.Router();
const groupController = require('../controllers/groupController');
const isAuthenticated=require('../middlewares/auth');


// function isAuthenticated(req, res, next) {
//   if (req.session.user) return next();
//   return res.redirect('/login');
// }

router.get('/create', isAuthenticated, groupController.getCreateGroup);
router.post('/create', isAuthenticated, groupController.postCreateGroup);
router.get('/:groupId', isAuthenticated, groupController.getGroupChat);
console.log('Router debug type:', router.constructor?.name);
module.exports = router;
