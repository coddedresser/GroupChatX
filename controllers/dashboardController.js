const User = require('../models/User');
const Group = require('../models/Group');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('groups');
    res.render('dashboard', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
};

exports.joinGroup = async (req, res) => {
  const { groupId } = req.body;
  try {
    const group = await Group.findOne({ groupId });
    if (!group) return res.redirect('/dashboard');

    const user = await User.findById(req.user.id);

    // Avoid duplicates
    if (!user.groups.includes(group._id)) {
      user.groups.push(group._id);
      group.members.push(user._id);
      await user.save();
      await group.save();
    }

    res.redirect(`/group/${group.groupId}`);
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};
