const express = require("express")
const fetch = require("node-fetch")
const app = express()
const mongoose = require("mongoose")
const cors = require("cors")
const bodyParser = require("body-parser")

app.use(cors())
app.use(bodyParser.json())

const host = '0.0.0.0';
const port = process.env.PORT || 5000;
const { MongoDBURI } = require("./config")
const Released = require("./models/Released")
const Subscription = require("./models/Subscription")
const { CheckDate } = require("./filtered")
const WeekDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const Time = 1000 * 60 * 5
let date
let arr

mongoose.connect(MongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(console.log("connected to db"))
.catch(err => console.log(err))

function CheckTitle(arr, title) {
    for (let i = 0; i < arr.length; i++) {
        if (title === arr[i].title) {
            return true
        }
    }
    return false
}

function SendNotification(title) {
    const notification = {
        "title": `${title} latest episode has dropped`,
        "subtitle": "Text"
    }

    let fcmTokens = new Array()

    Subscription.find({})
    .then(doc => {
        doc.map(d => fcmTokens.push(d.token))

        const notificationBody = {
            "notification": notification,
            "registration_ids": fcmTokens
        }

        fetch("https://fcm.googleapis.com/fcm/send", {
            "method": "POST",
            "headers": {
                "Authorization": "key="+"AAAAwdots08:APA91bHQ79JViwgaSYi5BFAqGPKb956CRbkBnROLModaMS7mIhGklGT4HtqjzAxp2OJ6nKEoBCiVxWf_QikJtKbcBzlxCx7p7e61LtgkwLA6RQX1-b_EYQPBfvFtveywlbLwYriq7sPF",
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(notificationBody)
        }).then(() => {
            console.log("Sent Successfully!")
        })
    })
}

function FetchFirstTime() {
    var today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tokyo"
      });    
    today = new Date(today)
    let Day = WeekDays[today.getDay()]
    fetch(`https://api.jikan.moe/v3/schedule/${Day}`)
    .then(res => res.json())
    .then(data => {
        let arr = data[Day.toLowerCase()]
        let dropped = CheckDate(arr)
        for (let i = 0; i < dropped.length; i++) {
            let Release = new Released({
                title: dropped[i].title,
                day: today.getDay()
            })
            Release.save()
        }
    })
}

async function CurrentDate() {
    var today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tokyo"
      });    
    today = new Date(today)
    let Day = WeekDays[today.getDay()]
    if (date === undefined || date != today.getDay()) {
        let data = await (await fetch(`https://api.jikan.moe/v3/schedule/${Day}`)).json()
        arr = data
        date = today.getDay()
        return arr
    }
    else {
        console.log("not fetching!")
        return arr
    }
}

const fetchData = () => {
    var today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tokyo"
      }); 
    today = new Date(today)
    let arr = CurrentDate()
    let Day = WeekDays[today.getDay()]
    arr.then( data => {
        let arr = data[Day.toLowerCase()]
        let dropped = CheckDate(arr)
        let num = 0
        if (dropped.length > 0) {
            Released.find({})
            .then(doc => {
                dropped.map(d => {
                    if (!CheckTitle(doc, d.title) && doc[0].day === today.getDay()) {
                        SendNotification(d.title)
                        let Release = new Released({
                            title: d.title,
                            day: today.getDay()
                        })
                        Release.save()
                        console.log("saved")
                    }
                    else if (!CheckTitle(doc, d.title) && doc[0].day != today.getDay()) {
                        let DayToRemove = doc[0].day
                        Released.find({day: DayToRemove}).deleteMany(() => console.log("prev day removed"))
                        SendNotification(d.title)
                        let Release = new Released({
                            title: d.title,
                            day: today.getDay()
                        })
                        Release.save()
                        console.log("next day saved")
                    }
                    else {
                        num += 1
                    }
                })
                if (num > 0) {
                    console.log(num)
                }
            })
        }
    })
}

fetchData()

setInterval(() => {
    fetchData()
}, Time)

app.options('*', cors())

app.get("/", (req, res) => {
    var today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tokyo"
      }); 
    today = new Date(today)
    let Day = WeekDays[today.getDay()]
    let arr = CurrentDate()
    arr.then(data => {
        let arr = data[Day.toLowerCase()]
        let dropped = CheckDate(arr)
        res.send(dropped)
    })
})

app.post("/get-token", (req, res) => {
    Subscription.find({token: req.body["token"]})
    .then(doc => {
        if (doc.length === 0) {
            let t = req.body["token"].split(":")[0]
            Subscription.find({token: {$regex: t}})
            .then(doc => {
                if (doc.length === 0) {
                    console.log("new")
                    let sub = new Subscription({
                        token: req.body["token"]
                    })
                    sub.save()
                    res.send("Successful")
                } else {
                    Subscription.deleteMany({token: {$regex: t}}, () => console.log("deleted"))
                    let sub = new Subscription({
                        token: req.body["token"]
                    })
                    sub.save()
                    res.send("Successful")
                }
            })
        }
        else {
            res.send("Already Exists")
        }
    })
})

app.listen(port, host, () => {
    console.log("Server Started at localhost:5000")
})