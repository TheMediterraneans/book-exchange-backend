
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const errorHandler = require("../middleware/errorHandler")

const { isAuthenticated } = require("../middleware/jwt.middleware");

const BookCopy = require("../models/BookCopy.model")
const Reservation = require("../models/Reservation.model");

const errorHandling = require("../error-handling");

//POST to create a new book copy
router.post("/mybooks/add", isAuthenticated, (req, res, next) => {
    console.log('Full request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { apiBookId, maxDuration } = req.body;
    const owner = req.payload._id; // assuming the user ID is in req.payload from isAuthenticated middleware
    
    console.log('Extracted data:', { externalId, maxDuration, owner });
    console.log('externalId type:', typeof externalId);
    console.log('externalId value:', externalId);
    
    BookCopy.create({
        apiBookId,
        owner,
        isAvailable: true, // new books are available by default
        maxDuration: maxDuration || 14 // use provided duration or default to 14
    })
    .then((response) => res.json(response))
    .catch(errorHandler);
});

//GET mybooks (user library)
router.get("/mybooks", isAuthenticated, (req, res, next) => {
    const userId = req.payload._id;
    
    BookCopy.find({ owner: userId })
    .populate("owner")
    .then((allCopies) => res.json(allCopies))
    .catch(errorHandler);
});

//PUT to modify the details of a copy like availability, duration of the loan
router.put("/mybooks/:mybooksId", isAuthenticated, (req, res, next) => {
    const { mybooksId } = req.params;
    const userId = req.payload._id;

    if (!mongoose.Types.ObjectId.isValid(mybooksId)) {
        res.status(400).json({ message: "The Id is not valid" });
        return;
    }

    // Only allow users to update their own books
    BookCopy.findOne({ _id: mybooksId, owner: userId })
    .then((bookCopy) => {
        if (!bookCopy) {
            return res.status(404).json({ message: "Book not found or you're not the owner" });
        }
        
        return BookCopy.findByIdAndUpdate(mybooksId, req.body, { new: true });
    })
    .then((updatedMybook) => res.json(updatedMybook))
    .catch(errorHandler);
});

//DELETE copy from library
router.delete("/mybooks/:mybooksId", isAuthenticated, (req, res, next) => {
    const { mybooksId } = req.params;
    const userId = req.payload._id;

    if (!mongoose.Types.ObjectId.isValid(mybooksId)) {
        res.status(400).json({ message: "The Id is not valid" });
        return;
    }

    // Only allow users to delete their own books
    BookCopy.findOneAndDelete({ _id: mybooksId, owner: userId })
    .then((deletedBook) => {
        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found or you're not the owner" });
        }
        res.json({ message: "The book has been removed from your library" });
    })
    .catch(errorHandler);
});

module.exports = router;