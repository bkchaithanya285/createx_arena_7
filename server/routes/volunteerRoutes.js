const express = require('express');
const router = express.Router();
const { markAttendance, getAssignedTeams, getStats, updateStars, verifyPPT, uploadPhoto } = require('../controllers/volunteerController');
const { validateSession } = require('../controllers/authController');

router.post('/mark-attendance', validateSession, markAttendance);
router.get('/assigned-teams', validateSession, getAssignedTeams);
router.get('/stats', validateSession, getStats);
router.post('/update-stars', validateSession, updateStars);
router.post('/verify-ppt', validateSession, verifyPPT);
router.post('/upload-photo', validateSession, uploadPhoto);

module.exports = router;
