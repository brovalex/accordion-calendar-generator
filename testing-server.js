import express from "express"
const app = express()

import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'

app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

app.get("/", (req, res) => {

  var settings = new Settings(["2023","1","12","pocket","1","letter"])

  const myCalendarData = new CalendarData(settings)
  // console.log(settings.template)
  const myCalendar = new SVGCalendar(myCalendarData, settings.template)

  res.send("<style>svg {width:396px;height:2916px;}</style>"+myCalendar.SVGcode);
  // res.send("hello");
});