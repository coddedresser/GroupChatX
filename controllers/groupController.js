const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const { nanoid } = require('nanoid');

exports.getCreateGroup = (req, res) => {
  res.render('create-group', { user: req.user });
};

exports.postCreateGroup = async (req, res) => {
  const { name } = req.body;
  const groupId = nanoid(8); // short unique ID
  try {
    const group = new Group({
      name,
      groupId,
      members: [req.user._id],
    });

    await group.save();
    
    res.redirect(`/group/${groupId}`);
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

exports.getGroupChat = async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const group = await Group.findOne({ groupId }).populate('members');
    const messages = await Message.find({ groupId }).populate('sender');

    if (!group) return res.redirect('/dashboard');

    res.render('group-chat', {
      user: req.user,
      group,
      messages,
      users: []
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};