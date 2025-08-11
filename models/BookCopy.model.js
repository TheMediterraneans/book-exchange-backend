const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const bookCopySchema = new Schema ({
    externalId: {
        type: String, //must fill with the book id from api
        required: true
    },
    title: {
        type: String,
        required: true
    },
    authors: [{
        type: String
    }],
    coverUrl: {
        type: String
    },
    publishedYear: {
        type: Number
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isAvailable: {
        type: Boolean,
        required: true
    },
    maxDuration: {
        type: Number,
        default: 14,
        min: 1,
        max: 30
    }
});

const BookCopy = model("BookCopy", bookCopySchema);

module.exports = BookCopy;