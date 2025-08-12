const express = require('express');
const router = express.Router();
const BookCopy = require('../models/BookCopy.model');
const Reservation = require('../models/Reservation.model');

const { isAuthenticated } = require("../middleware/jwt.middleware");

const MAX_DURATION = 30;

// Update your reservation route to:
router.post('/reservations', isAuthenticated, async (req, res, next) => {
    try {
        const { bookCopyId, requestedDays } = req.body;
        const userId = req.payload._id;

        // Check if book copy exists and is available FIRST
        const bookCopy = await BookCopy.findById(bookCopyId).populate('owner');
        if (!bookCopy) {
            return res.status(404).json({ error: 'Book copy not found' });
        }

        // NEW: Prevent users from reserving their own books
        if (bookCopy.owner._id.toString() === userId.toString()) {
            return res.status(400).json({ error: 'You cannot reserve your own book' });
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

        // FIXED: Use maxDuration instead of maxLoanDays
        const maxAllowed = bookCopy.maxDuration || MAX_DURATION;
        // Use maxDuration from bookCopy model or MAX_DURATION as fallback
        const maxAllowed = bookCopy.maxDuration || MAX_DURATION;
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
// PUT /reservations/:reservationId - update reservation duration
router.put('/reservations/:reservationId', isAuthenticated, async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { requestedDays } = req.body;
        const userId = req.payload._id;

        // Validate requested duration
        if (!requestedDays || requestedDays < 1) {
            return res.status(400).json({
                error: 'Reservation duration must be at least 1 day'
            });
        }

        // Find the reservation with populated book data
        const reservation = await Reservation.findById(reservationId).populate('book');
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Check if the user owns this reservation
        if (reservation.requestBy.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only modify your own reservations' });
        }

        // Get the book copy to check max duration
        const bookCopy = await BookCopy.findById(reservation.book._id);
        if (!bookCopy) {
            return res.status(404).json({ error: 'Associated book copy not found' });
        }

        // Validate against maximum allowed duration
        const maxAllowed = bookCopy.maxDuration || MAX_DURATION;
        if (requestedDays > maxAllowed) {
            return res.status(400).json({
                error: `Reservation duration cannot exceed ${maxAllowed} days`
            });
        }

        // Calculate new end date based on original start date
        const newEndDate = new Date(reservation.startDate);
        newEndDate.setDate(newEndDate.getDate() + requestedDays);

        // Update the reservation
        reservation.endDate = newEndDate;
        await reservation.save();

        // Return the updated reservation with populated data
        const updatedReservation = await Reservation.findById(reservationId)
            .populate(['requestBy', 'book']);

        res.status(200).json({
            message: 'Reservation updated successfully',
            reservation: updatedReservation
        });

    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /reservations - get current user's reservations
router.get('/reservations', isAuthenticated, async (req, res) => {
    try {
        const userId = req.payload._id;

        const reservations = await Reservation.find({ requestBy: userId })
            .populate({
                path: 'book',
                populate: {
                    path: 'owner',
                    select: 'name email'
                }
            })
            .sort({ startDate: -1 });

        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// PUT /reservations/:reservationId - update a reservation
router.put('/reservations/:reservationId', isAuthenticated, async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { requestedDays, endDate } = req.body;
        const userId = req.payload._id;

        // Find the reservation
        const reservation = await Reservation.findById(reservationId).populate('book');
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Check if the user owns this reservation
        if (reservation.requestBy.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only edit your own reservations' });
        }

        // Validate requested duration if provided
        if (requestedDays) {
            if (requestedDays < 1) {
                return res.status(400).json({
                    error: 'Reservation duration must be at least 1 day'
                });
            }

            // Use maxDuration from bookCopy model or MAX_DURATION as fallback
            const maxAllowed = reservation.book.maxDuration || MAX_DURATION;
            if (requestedDays > maxAllowed) {
                return res.status(400).json({
                    error: `Reservation duration cannot exceed ${maxAllowed} days`
                });
            }
        }

        // Update the reservation
        const updateData = {};
        if (endDate) {
            updateData.endDate = new Date(endDate);
        } else if (requestedDays) {
            // Calculate new end date based on start date and new duration
            const newEndDate = new Date(reservation.startDate);
            newEndDate.setDate(newEndDate.getDate() + requestedDays);
            updateData.endDate = newEndDate;
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(
            reservationId, 
            updateData, 
            { new: true }
        ).populate(['requestBy', 'book']);

        res.status(200).json({
            message: 'Reservation updated successfully',
            reservation: updatedReservation
        });

    } catch (error) {
        console.error('Error updating reservation:', error);
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