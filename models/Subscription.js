const mongoose = require("mongoose")
const Schema = mongoose.Schema

const SubscriptionSchema = new Schema({
    token: {
        type: String,
        require: true
    },
})

module.exports = mongoose.model("Subscription", SubscriptionSchema)