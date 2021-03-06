const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ReleasedSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    day: {
        type: Number,
        require: true
    }
})

module.exports = mongoose.model("Released", ReleasedSchema)