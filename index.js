const express = require("express")
const fetch = require("node-fetch")
const app = express()
const mongoose = require("mongoose")
const cors = require("cors")
const random = require("./models/random")

app.use(cors())

const { MongoDBURI } = require("./config")
const Released = require("./models/Released")
const { CheckDate } = require("./filtered")
const WeekDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const Time = 1000 * 60 * 1
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

    let fcmTokens = [
        "d32VPKs77A-0co1EB4RaLu:APA91bG43MISdYngrvHJSVIZmjgUtD_QK1UFzehCYEk8XatVcKQap5qHSbK13lgIdywIf71UNqfW_J_a5OKZCi25nxbEfbt0P1t3VmWL3FZ5cbTdu8e_LAdlRwJVr-DIA9GsyAFEYcY9"
    ]

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

setInterval(() => {
    let r = new random({
        title: "l",
        day: 1
    })
    r.save()
}, 10000)

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

app.listen(5000, () => {
    console.log("Server Started at localhost:5000")
})