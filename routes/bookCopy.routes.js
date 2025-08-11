
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { isAuthenticated } = require("../middleware/jwt.middleware");

const BookCopy = require("../models/BookCopy.model")


//POST to create a new book copy

router.post("/mybooks/add", isAuthenticated, (req, res, next) => {
    console.log('Full request body:', req.body);
    console.log('Request headers:', req.headers);

    const { externalId, maxDuration, title, authors, coverUrl, publishedYear } = req.body;
    const owner = req.payload._id;

    console.log('Extracted data:', { externalId, maxDuration, owner });
    console.log('externalId type:', typeof externalId);
    console.log('externalId value:', externalId);

    console.log('About to create BookCopy with data:', {
        externalId,
        title,
        authors,
        coverUrl,
        publishedYear,
        owner,
        isAvailable: true,
        maxDuration: maxDuration || 14
    });

    BookCopy.create({
        externalId,
        title,
        authors,
        coverUrl,
        publishedYear,
        owner,
        isAvailable: true,
        maxDuration: maxDuration || 14
    })
        .then((response) => {
            console.log('BookCopy created successfully:', response);
            res.json(response);
        })
        .catch((error) => {
            console.log('Error creating BookCopy:', error);
            next(error);
        });
});

//GET mybooks (user library)
router.get("/mybooks", isAuthenticated, (req, res, next) => {
    const userId = req.payload._id;

    BookCopy.find({ owner: userId })
        .populate("owner")
        .then((allCopies) => res.json(allCopies))
        .catch(next);
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
        .catch(next);
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
        .catch(next);
});


router.get("/search-available-books", isAuthenticated, (req, res, next) => {
    const { q } = req.query;
    const currentUserId = req.payload._id;

    if (!q || q.trim() === '') {
        return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(q, 'i'); // case-insensitive search

    BookCopy.find({
        isAvailable: true,
        $or: [
            { title: searchRegex },
            { authors: { $in: [searchRegex] } }
        ]
    })
        .populate("owner", "name email") // include owner info for contact
        .then((availableBooks) => {
            // Group books by externalId to show all copies
            const groupedBooks = {};

            availableBooks.forEach(book => {
                if (!groupedBooks[book.externalId]) {
                    groupedBooks[book.externalId] = {
                        externalId: book.externalId,
                        title: book.title,
                        authors: book.authors,
                        coverUrl: book.coverUrl,
                        publishedYear: book.publishedYear,
                        copies: []
                    };
                }
                groupedBooks[book.externalId].copies.push({
                    _id: book._id,
                    owner: book.owner,
                    maxDuration: book.maxDuration,
                    isOwnedByCurrentUser: book.owner._id.toString() === currentUserId.toString()
                });
            });

            const result = Object.values(groupedBooks);
            console.log(`Found ${result.length} unique books with ${availableBooks.length} total copies`);
            res.json(result);
        })
        .catch((error) => {
            console.error('Search error:', error);
            next(error);
        });
});

// GET browse available copies to borrow (PUBLIC - no authentication required)
router.get("/browse-available-books", (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(q, 'i'); // case-insensitive search

    BookCopy.find({
        isAvailable: true,
        $or: [
            { title: searchRegex },
            { authors: { $in: [searchRegex] } }
        ]
    })
        .select('-owner') // Exclude owner information for privacy
        .then((availableBooks) => {
            // Group books by externalId without owner details
            const groupedBooks = {};

            availableBooks.forEach(book => {
                if (!groupedBooks[book.externalId]) {
                    groupedBooks[book.externalId] = {
                        externalId: book.externalId,
                        title: book.title,
                        authors: book.authors,
                        coverUrl: book.coverUrl,
                        publishedYear: book.publishedYear,
                        availableCount: 0
                    };
                }
                groupedBooks[book.externalId].availableCount++;
            });

            const result = Object.values(groupedBooks);
            console.log(`Public browse: Found ${result.length} unique books with ${availableBooks.length} total copies`);
            res.json(result);
        })
        .catch((error) => {
            console.error('Browse error:', error);
            next(error);
        });
});

module.exports = router;