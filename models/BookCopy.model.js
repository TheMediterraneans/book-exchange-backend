const {Schema, model} = require("mongoose")

const bookCopySchema = new Schema ({
    apiBookId: {
        type: String, //must fill with the book id from api
        required: true,
        unique: true
    }, 
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

})

const BookCopy = model("BookCopy", bookCopySchema)

module.exports = BookCopy