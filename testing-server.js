// run: 
// nodemon start
// for hot reloading on node v20+

import express from "express"
const app = express()

import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'

app.listen(3000, () => {
  console.log("Application started and Listening on port 3000\nhttp:\/\/localhost:3000");
});

app.get("/", (req, res) => {

  var settings = new Settings(["2023","1","12","pocket","7","roll"])

  const myCalendarData = new CalendarData(settings)
  // console.log(settings.template)
  const myCalendar = new SVGCalendar(myCalendarData, settings.template)

  res.send("<html><body><style>body {margin:0} svg {width:"+(settings.paper.width)*72+"px;height:"+(settings.paper.height+2*settings.paper.margin)*72+"px;border:10px solid aqua;}</style></body></html>"+myCalendar.SVGcode);
  // res.send("hello");
});