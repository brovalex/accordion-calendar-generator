// structure attempt

//each probably in separate file
// ⚠️⚠️⚠️
// multiple page split makes things even more complicated here
// e.g. generate one print page at a time
// ⚠️⚠️⚠️
Mechanical {
    // add crop marks, split to printable pages
    // ....
    var maxPages = Math.floor((cal.paper_h-cal.paper_margin*2)*72/page_h)
    // templates in inches
    // TODO this will ERROR need to implement paper JSON
    var paper = {
        roll: {
            paper_w: 12.5,
            paper_h: "roll"
        },
        pocket: {
            width: 5.5, 
            height: 3.5-1/8,
            paper_w: 7,
            paper_h: 42
        },
        letter: {
            paper_w: 11,
            paper_h: 8.5
        }
    }
}
SVGRenderer {
    //... generate SVG
    // returns a window with a document and an svg root node
    const window   = require('svgdom')
    const SVG      = require('svg.js')(window)
    const document = window.document
    // outlining typefaces
    const TextToSVG = require('text-to-svg');
    const textToSVG = TextToSVG.loadSync('fonts/nimbus bold 724726a7-b3d6-4c01-ac68-73ef3673e3e1.ttf');
    const monthToSVG = TextToSVG.loadSync('fonts/nimbus 1 - dc9d32c4-6c53-4bb1-8bef-4cd396bee3ce.ttf');
    const digitsToSVG = TextToSVG.loadSync('fonts/nimbus mono d7dfb1f6-0918-41e9-a9d2-bf7241c11fae.ttf');
    const weeksToSVG = TextToSVG.loadSync('fonts/nimbus regular a70c1179-4a1d-4887-8eb1-d4f6ce17cfb4.ttf');
    //to use
    Designer
}
Designer {
    // all the spacing, settings, etc
    // from
    var templates = {
        biggin: {
            width: 8.25, 
            height: 5.75-1/8
        },
        pocket: {
            width: 5.5, 
            height: 3.5-1/8
        }
    }
    var showMonthTracker = (weekStartsOn == 1) ? true : false
    cal_w = templates[template].width*72
    page_hPadding = 3/16*72
    page_hShift = 1/16*72
    page_w = cal_w-2*page_hPadding
    page_h = templates[template].height*72
    bleed = 1/8*72
    padding_x = 1/16*72
    padding_y = 1/16*72
    var cal = {}
        cal.paper_margin = 0.5
        cal.paper_w = templates[template].paper_w
        cal.paper_h = (templates[template].paper_h=="roll") ? page_h/72*number_of_months+2*cal.paper_margin : templates[template].paper_h

    Paginator...
}
function Paginator(calWeeks = myCalendar.calWeeks) {
    // split by calendar pages from the raw data
    // from
    var calPages = ((weeks) => {
        calPages = [[]]
        var i = 0, j=0
        while (i < weeks.length) {
            // if day0 > day6 (e.g. 28 > 4) then it's last week of month which is carried over to next month
            isLastWeek = dateFns.getDate(weeks[i][0]) > dateFns.getDate(weeks[i][6])
            // if day0 is on 1st OR if last week but not first or last week then next page
            if( (j!=0?dateFns.isFirstDayOfMonth(weeks[i][0]):false) || (isLastWeek && i!=0 && i!=weeks.length-1)) {
                j+=1
                calPages[j]=[]
            }
            calPages[j].push(weeks[i])
            i++
        }
        return calPages
    })(calWeeks)
}
function Calendar(start, number_of_months, weekStartsOn) {
    // raw calendar _data_
    // ... dateFns
    const dateFns = require('date-fns');
    var start_date = new Date(start.year, start.month-1, 1)
    var end_date = dateFns.lastDayOfMonth(dateFns.addMonths(start_date,number_of_months-1))
    //static
    var daysOfWeek = [...Array(7).keys()].map((d)=>{return dateFns.format(dateFns.addDays(dateFns.startOfWeek(start_date,{weekStartsOn:weekStartsOn}),d),'ddd')})
    // CREATE CALENDAR DATA
    var calStart = dateFns.startOfWeek(start_date,{weekStartsOn:weekStartsOn})
    var calEnd   = dateFns.endOfWeek(end_date,{weekStartsOn:weekStartsOn})
    var calDays = dateFns.eachDay(calStart, calEnd)
    var calWeeks = ((days) => {
	calWeeks = []
	while (days.length) {
		calWeeks.push(days.splice(0, 7));
	}
	return calWeeks
})(calDays)
}
PDFWriter {
    // Write the file
    var fs = require('fs'),
    PDFDocument = require('pdfkit'),
    SVGtoPDF = require('svg-to-pdfkit');
    var doc = new PDFDocument({
        size: [cal.paper_w*72, cal.paper_h*72],
        autoFirstPage: false,
    })
    // might be worth separating the PDF generation too
    // from
    SVGRenderer
}
class ArgsStuff {
    // static for now, TODO make args
    var start = {year: 2023, month: 1} // 1 = january, I usually start on December the year before, and end on the January the year after
    var number_of_months = 12
    //
    //TODO gracefully catch errors
    const myArgs = process.argv.slice(2);
    var template = myArgs[0]
    var weekStartsOn = myArgs[1] ; //1 = Monday, 7 = Sunday
}
main {
    // get inputs from command line
    const settings = new ArgsStuff()
    myCalendar = Calendar(settings.start, settings.number_of_months, settings.weekStartsOn)
    // to call
    PDFWriter...
}
main() // run