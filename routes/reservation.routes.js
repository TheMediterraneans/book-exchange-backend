const express = require('express');
const router = express.Router();
const BookCopy = require('../models/BookCopy.model');
const Reservation = require('../models/Reservation.model');

const { isAuthenticated } = require("../middleware/jwt.middleware");

// Maximum reservation duration in days
const MAX_DURATION = 30;

// POST /reservations - create a new reservation
router.post('/reservations', isAuthenticated, async (req, res) => {
    try {
        const { bookCopyId, requestedDays } = req.body;
        const userId = req.payload._id;

        // Check if book copy exists and is available FIRST
        const bookCopy = await BookCopy.findById(bookCopyId);
        if (!bookCopy) {
            return res.status(404).json({ error: 'Book copy not found' });
        }

        if (!bookCopy.isAvailable) {
            return res.status(400).json({ error: 'Book is not available for reservation' });
        }

        // Validate requested duration
        if (!requestedDays || requestedDays < 1) {
            return res.status(400).json({
                error: 'Reservation duration must be at least 1 day'
            });
        }

        // Use maxLoanDays from bookCopy model or MAX_DURATION as fallback
        const maxAllowed = bookCopy.maxLoanDays || MAX_DURATION;
        if (requestedDays > maxAllowed) {
            return res.status(400).json({
                error: `Reservation duration cannot exceed ${maxAllowed} days`
            });
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + requestedDays);

        // Create reservation
        const reservation = new Reservation({
            requestBy: userId,
            book: bookCopyId,
            startDate,
            endDate
        });

        await reservation.save();

        // Mark book as unavailable
        bookCopy.isAvailable = false;
        await bookCopy.save();

        res.status(201).json({
            message: 'Book reserved successfully',
            reservation: await reservation.populate(['requestBy', 'book'])
        });

    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /reservations - get current user's reservations
router.get('/reservations', isAuthenticated, async (req, res) => {
    try {
        const userId = req.payload._id;

        const reservations = await Reservation.find({ requestBy: userId })
            .populate('book')
            .sort({ startDate: -1 }); // from newest to oldest reservation

        res.status(200).json(reservations);

    } catch (error) {
        console.error('Error fetching user reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// DELETE /reservations/:reservationId - cancel a reservation
router.delete('/reservations/:reservationId', isAuthenticated, async (req, res) => {
    try {
        const { reservationId } = req.params;
        const userId = req.payload._id;

        // Find the reservation
        const reservation = await Reservation.findById(reservationId).populate('book');
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Check if the user owns this reservation
        if (reservation.requestBy.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only cancel your own reservations' });
        }

        // Make the book available again
        const bookCopy = await BookCopy.findById(reservation.book._id);
        if (bookCopy) {
            bookCopy.isAvailable = true;
            await bookCopy.save();
        }

        // Delete the reservation
        await Reservation.findByIdAndDelete(reservationId);

        res.status(200).json({
            message: 'Reservation cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;