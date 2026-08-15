const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper: throws if the requesting user isn't a member of the group
const assertMembership = (group, userId) => {
  const isMember = group.members.some((m) => m.toString() === userId.toString());
  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this group');
  }
};

// @route  POST /api/groups
// @access Private
const createGroup = asyncHandler(async (req, res) => {

  if (!name) {
    throw new ApiError(400, 'Group name is required');
  }

  const memberUsers = memberEmails.length
    ? await User.find({ email: { $in: memberEmails.map((e) => e.toLowerCase()) } })
    : [];

  // creator is always a member, de-duped
  const memberIds = new Set(memberUsers.map((u) => u._id.toString()));
  memberIds.add(req.user._id.toString());

  const group = await Group.create({
    name,
    description,
    createdBy: req.user._id,
    members: Array.from(memberIds)
  });

  res.status(201).json({ success: true, group });
});

// @route  GET /api/groups
// @access Private
const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate('members', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: groups.length, groups });
});

// @route  GET /api/groups/:id
// @access Private
const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate('members', 'name email');

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  assertMembership(group, req.user._id);

  res.status(200).json({ success: true, group });
});

// @route  POST /api/groups/:id/members
// @access Private
const addMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email is required to add a member');
  }

  const group = await Group.findById(req.params.id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  assertMembership(group, req.user._id);

  const userToAdd = await User.findOne({ email: email.toLowerCase() });
  if (!userToAdd) {
    throw new ApiError(404, 'No user found with that email');
  }

  const alreadyMember = group.members.some((m) => m.toString() === userToAdd._id.toString());
  if (alreadyMember) {
    throw new ApiError(409, 'User is already a member of this group');
  }

  group.members.push(userToAdd._id);
  await group.save();
  await group.populate('members', 'name email');

  res.status(200).json({ success: true, group });
});

module.exports = { createGroup, getGroups, getGroupById, addMember, assertMembership };