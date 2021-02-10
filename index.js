const express = require('express')
const fetch = require("node-fetch")
const app = express()
const port = 4000

const WeekDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
let arr
const Time = 1000 * 60 * 60

function NewDate(SomeDate) {
  let Current = new Date().toISOString()
  let CurrentSplit = Current.split("T")
  let AnimeTime = SomeDate.split("T")
  if (CurrentSplit[1] > AnimeTime[1]) {
    return true
  }
  else {
    return false
  }
}

function CheckDate(ArrayOfAnime) {
  let HasDropped = []
  for (let i = 0; i < ArrayOfAnime.length; i++) {
    if (NewDate(ArrayOfAnime[i].airing_start)) {
        HasDropped.push(ArrayOfAnime[i])
    }
  }
  return HasDropped
}

async function FetchData() {
  let Day = WeekDays[new Date().getDay()]
  let data = await (await fetch(`https://api.jikan.moe/v3/schedule/${Day}`)).json()
  return data[Day.toLowerCase()]
}

arr = FetchData()

setInterval(() => {
  arr = FetchData()
}, Time)

app.get("/", (req, res) => {
  if (arr === undefined) {
    res.send("Not Available")
  } else {
    arr.then(data => {
      let Dropped = CheckDate(data)
      res.send(Dropped)
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
