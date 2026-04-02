const express = require('express');
const router = express.Router();
const { 
  updateConfig, 
  getScoreboard, 
  getAnalytics, 
  exportData, 
  getTeams, 
  getReviewers, 
  assignReviewer,
  getAttendanceStats,
  getAttendanceDashboard,
  getGameLeaderboard,
  managePolls,
  manageAttendanceSessions,
  clearData,
  removeMapping,
  getDashboardSummary
} = require('../controllers/adminController');
const { validateSession } = require('../controllers/authController');

router.post('/config', validateSession, updateConfig);
router.get('/scoreboard', validateSession, getScoreboard);
router.get('/summary', validateSession, getDashboardSummary);
router.get('/analytics', validateSession, getAnalytics);
router.get('/export', validateSession, exportData);
router.get('/teams', validateSession, getTeams);
router.get('/reviewers', validateSession, getReviewers);
router.post('/reviewer-assign', validateSession, assignReviewer);
router.get('/attendance-stats', validateSession, getAttendanceStats);
router.get('/attendance-dashboard', validateSession, getAttendanceDashboard);
router.get('/sessions', validateSession, manageAttendanceSessions);
router.post('/sessions', validateSession, manageAttendanceSessions);
router.get('/game-leaderboard', validateSession, getGameLeaderboard);
router.get('/poll', validateSession, managePolls);
router.post('/poll', validateSession, managePolls);
router.post('/remove-mapping', validateSession, removeMapping);
router.post('/clear-data', validateSession, clearData);

module.exports = router;
