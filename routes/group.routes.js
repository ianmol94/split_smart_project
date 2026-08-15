const express = require('express');
const {
  createGroup,
  getGroups,
  getGroupById,
  addMember
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // every group route requires authentication

router.route('/').post(createGroup).get(getGroups);
router.route('/:id').get(getGroupById);
router.route('/:id/members').post(addMember);

module.exports = router;