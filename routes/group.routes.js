const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { createGroup, addMember, getGroup } = require('../controllers/group.controllers');
router.use(protect); // all group routes require login
router.post('/', createGroup);
router.post('/:groupId/members', addMember);
router.get('/:groupId', getGroup);
module.exports = router;