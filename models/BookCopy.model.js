const mongoose = require("mongoose")
const {Schema, model} = mongoose

const bookCopySchema = new Schema ({
    externalId: {
        type: String, //must fill with the book id from api
        required: true
    }, 
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isAvailable: { //will change when book is reserved
        type: Boolean,
        required: true
    },
    maxDuration: {
        type: Number,
        default: 14,
        min: 1,
        max: 30
    } 

})

const BookCopy = model("BookCopy", bookCopySchema)

module.exports = BookCopy