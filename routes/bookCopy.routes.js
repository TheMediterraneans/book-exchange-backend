const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const errorHandler = require("../middleware/errorHandler")

const { isAuthenticated } = require("../middleware/jwt.middleware");

const BookCopy = require("../models/BookCopy.model")
const Reservation = require("../models/Reservation.model");
const errorHandling = require("../error-handling");

//POST to create a new book copy

router.post("/mybooks", isAuthenticated, (req, res, next) => {
    const { title } = req.body

    BookCopy.create({title, description, isAvailable})
    .then((response) => res.json(response))
    .catch(errorHandler)
});

//GET mybooks (user library) // add in the front the isAvailable button on the side? of the book in the list

router.get("/mybooks", isAuthenticated, (req, res, next) => {
    BookCopy.find()
    .populate(bookApiId)
    .then((allCopies) => res.json(allCopies))
    .catch(errorHandler)
})

//PUT to modify the detals of a copy like availability, duration of the loan

router.put("mybooks/:mybooksId", isAuthenticated, (req, res, next) => {
    const {mybooksId} = req.params;

    if (!mongoose.Types.ObjectId.isValid(mybooksId)) {
        res.status(400).json({message: "The Id is not valid"})
        return;
    }

    BookCopy.findByIdAndUpdate(mybooksId, req.body, {new: true})
    .then((updateMybook) => res.json(updateMybook))
    .catch(errorHandler)
   
})


//DELETE copy from library

router.delete("mybooks/:mybooksId", isAuthenticated, (req, res, next) => {
    const {mybooksId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(mybookId)) {
        res.status(400).json({message: "The Id is not valid"})
    }

    BookCopy.findByIdAndDelete(mybookId)
    .then(() => {
        res.json({message: "The book has been removed from your library"})
    })
    .catch(errorHandler)
})

module.exports = router;


