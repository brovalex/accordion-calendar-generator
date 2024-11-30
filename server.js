// npx nodemon start

import express from "express"
const app = express()

import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'

app.listen(3000, () => {
  console.log("Application started and Listening on port 3000\nhttp:\/\/localhost:3000");
});

app.get("/", (req, res) => {

  var settings = new Settings(["2024","1","12","pocket","sunday","strip"])

  const myCalendarData = new CalendarData(settings)
  // console.log(settings.template)
  const myCalendar = new SVGCalendar(myCalendarData, settings.template)
  //TODO: add colours
  console.log(settings.paper.sizes.width, settings.paper.sizes.height)
  res.send("<html><body><style>body {margin:0} svg {width:"+(settings.paper.sizes.width)*72+"px;height:"+(settings.paper.sizes.height+2*settings.paper.margin)*72+"px;border:10px solid aqua;}</style></body></html>"+myCalendar.svgCode);
});