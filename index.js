import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'
import OutputPDF from './Classes/outputPDF.js'

// TODO major
// - [ ] Making the SVGs... not sure how to structure right now
// - [ ] Rewrite with factory functions instead of classes (better fit for JS)
//       https://www.freecodecamp.org/news/class-vs-factory-function-exploring-the-way-forward-73258b6a8d15
//       https://www.freecodecamp.org/news/removing-javascripts-this-keyword-makes-it-a-better-language-here-s-why-db28060cc086/
// TODO minor
// - [ ] Clean up variable names, e.g. camelCase vs underscores, etc.
// - [ ] Catch errors eg template not found

// QUESTIONS/FEEDBACK
// - ( ) Case and naming suggestions needed for files, folders, variable names in different places...
// - ( ) I'm not super keen on how settings for templates/paper and dates are together. I don't anticipate the library/API to be used to generate just calendar data by week, but it doesn't feel great to have it all together. 
// - ( ) this. ... are looking messy in svgCalendar

function init() {
    if (process.argv.length == 8) { // node file.js ... + [0...5]
        var settings = new Settings(process.argv.slice(2))
        console.log("Year to start on: ", settings.start,                   // myArgs[0]
                    "\nMonth to start on: ", settings.start,                // myArgs[1]
                    "\nNumber of months: ", settings.number_of_months,      // myArgs[2]
                    "\nTemplate: ", settings.template,                      // myArgs[3]
                    "\nWeek starts on: ", settings.week_starts_on,          // myArgs[4]
                    "\nPaper: ", settings.paper                             // myArgs[5]
                    )
    } else {
        throw new Error('Arguments missing, please use start_year start_month number_of_months template week_starts_on paper_size \n for example: \n node index\ structure.js 2023 1 12 pocket 1 strip');
    }
    const myCalendarData = new CalendarData(settings)
    const myCalendar = new SVGCalendar(myCalendarData, settings.template)
    const filename = 'calendar-'+settings.template.name+'-'+settings.start.year+'-'+settings.start.month+'-'+(settings.week_starts_on==1?"monday":"sunday")+'-'+settings.paper.width+'x'+settings.paper.height+'-'+settings.number_of_months+'months'+'.pdf' //'calendar.pdf' //
    const myPDFfile = new OutputPDF(myCalendar, filename)
}
init()