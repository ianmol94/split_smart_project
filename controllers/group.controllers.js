const Group = require('../models/group');
const User = require('../models/users');

// POST /api/groups
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id] // creator is auto-added
    });
    res.status(201).json(group);
  } catch (err) { next(err); }
};

// POST /api/groups/:groupId/members
exports.addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    group.members.push(userToAdd._id);
    await group.save();

    res.json(group);
  } catch (err) { next(err); }
};

// GET /api/groups/:groupId
exports.getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email')   // replaces IDs with actual user data
      .populate('createdBy', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) { next(err); }
};