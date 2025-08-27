const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  createBooking,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  updateBooking
} = require('../controllers/bookingController');

// Booking routes
router.get('/', getAllBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById); 

// Owner-specific booking management endpoints (MUST come before general /:id route)
router.put('/:id/accept', acceptBooking);
router.put('/:id/reject', rejectBooking);
router.put('/:id/complete', completeBooking);

// General booking update endpoint (MUST come after specific routes)
router.put('/:id', updateBooking);

module.exports = router;
