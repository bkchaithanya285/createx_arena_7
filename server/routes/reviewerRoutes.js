const express = require('express');
const router = express.Router();
const { submitEvaluation, getAssignedTeams } = require('../controllers/reviewerController');
const { validateSession } = require('../controllers/authController');

router.post('/submit-evaluation', validateSession, submitEvaluation);
router.get('/assigned-teams', validateSession, getAssignedTeams);

module.exports = router;
