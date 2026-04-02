const express = require('express');
const router = express.Router();
const { getTeamProfile, getAttendance, submitGameScore, getGamesStatus, getDashboardState } = require('../controllers/teamController');
const { validateSession } = require('../controllers/authController');

router.get('/me', validateSession, getTeamProfile);
router.get('/me/attendance', validateSession, getAttendance);
router.post('/games/submit', validateSession, submitGameScore);
router.get('/me/games', validateSession, getGamesStatus);
router.get('/dashboard-state', validateSession, getDashboardState);

module.exports = router;
