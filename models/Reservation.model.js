const { Schema, mongoose } = require("mongoose")

const reservationSchema = new Schema({
    requestBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookCopy"
    },
    startDate: Date,
    endDate: Date
})

const Reservation = model("Reservation", reservationSchema)

module.exports = Reservation