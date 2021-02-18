function NewDate(SomeDate) {
  var today = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Tokyo"
    });
  let Current = new Date().toISOString()
  let CurrentSplit = Current.split("T")
  SomeDateSplit = SomeDate.split("T")
  let Final = String(CurrentSplit[0]) + "T" + String(SomeDateSplit[1])
  let AnimeTime = new Date(Final).toLocaleString("en-US", {
      timeZone: "Asia/Tokyo"
  })
  let Time = AnimeTime.split(", ")
  let FinalTime = today.split(",")[0] + ", " + Time[1]
  if (new Date(today).toISOString() > new Date(FinalTime).toISOString()) {
      return true
  }
  else {
    console.log(today, FinalTime)
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

module.exports = { NewDate, CheckDate }