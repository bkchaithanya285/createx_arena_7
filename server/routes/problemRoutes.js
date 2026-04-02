const express = require('express');
const router = express.Router();
const { selectProblem, getProblems, getProblemById } = require('../controllers/problemController');
const { validateSession } = require('../controllers/authController');

router.get('/', validateSession, getProblems);
router.get('/:id', validateSession, getProblemById);
router.post('/select', validateSession, selectProblem);

module.exports = router;
