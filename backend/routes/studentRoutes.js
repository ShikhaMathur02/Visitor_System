const express = require('express');
const router = express.Router();
const {
    getAllStudents,
    getStudentById,
    studentEntry,
    requestExit,
    approveExit,
    confirmExit,
    deleteStudent,
    getPendingExits,
    getApprovedExits
} = require('../controllers/studentController');

// Place specific routes before parameterized routes
router.get('/pending-exits', getPendingExits);
router.get('/approved-exits', getApprovedExits);
router.get('/', getAllStudents);

// Entry and exit routes
router.post('/entry', studentEntry);
router.post('/request-exit', requestExit);
router.post('/approve-exit', approveExit);
router.post('/confirm-exit', confirmExit);

// Parameterized routes should come last
router.get('/:id', getStudentById);
router.delete('/:id', deleteStudent);

module.exports = router;
