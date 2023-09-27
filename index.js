// Main file for re-structured code

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

// function SVGRenderer() {
//     //... generate SVG
//     // returns a window with a document and an svg root node
//     const window   = require('svgdom')
//     const SVG      = require('svg.js')(window)
//     const document = window.document
//     // outlining typefaces
//     const TextToSVG = require('text-to-svg');
//     const textToSVG = TextToSVG.loadSync('fonts/nimbus bold 724726a7-b3d6-4c01-ac68-73ef3673e3e1.ttf');
//     const monthToSVG = TextToSVG.loadSync('fonts/nimbus 1 - dc9d32c4-6c53-4bb1-8bef-4cd396bee3ce.ttf');
//     const digitsToSVG = TextToSVG.loadSync('fonts/nimbus mono d7dfb1f6-0918-41e9-a9d2-bf7241c11fae.ttf');
//     const weeksToSVG = TextToSVG.loadSync('fonts/nimbus regular a70c1179-4a1d-4887-8eb1-d4f6ce17cfb4.ttf');
//     //to use
//     //?
// }

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
    
    // console.log(myCalendar.pages)
    // console.log("test\n--------\n", myCalendar)
    // myDocument = new Document(myCalendar, settings.paper)

    // SVG data
    // mechanicals with crop lines and bleed
    // PDFWriter...
}
init() // run


// ////////////////////////
// WIP                   //
// ////////////////////////

// function PDFWriter() {
//     // Write the file
//     var fs = require('fs'),
//     PDFDocument = require('pdfkit'),
//     SVGtoPDF = require('svg-to-pdfkit');
//     var doc = new PDFDocument({
//         size: [cal.paper_w*72, cal.paper_h*72],
//         autoFirstPage: false,
//     })
//     // might be worth separating the PDF generation too
//     // from
//     //SVGRenderer...
// }



// class Document {
//     constructor (calendar, paper) {
//         this.padding_x = 1/16*72 // margins around elements, e.g. so text anchor is not right against a line
//         this.padding_y = 1/16*72
//         this.page_hPadding = 3/16*72 // inner padding on the design
//         this.page_hShift = 1/16*72 // TODO don't really remember this one
        
//         // TODO: throw error if page is too narrow or short for a proper print
//         // figure out how many calendar-pages for each mechanical-page
//         this.maxPages = Math.floor( (paper.availHeight)/(calendar.template.height) ) // note: all in inches

//         // cal_w = calendar.template.width*72
//         // page_w = cal_w-2*page_hPadding

//         // var cal = {}
//         //     cal.paper_w = calendar.template.paper_w
//         //     cal.paper_h = (calendar.template.paper_h=="roll") ? page_h/72*number_of_months+2*cal.paper_margin : calendar.template.paper_h



//         // ...
//         // might as well save to pdf here, because unlike to need pages in other format
//     }
// }
// class MechanicalsPage {
//     constructor (svgPage) {
//         var bleed = 1/8*72 // setting this as a constant, don't need to have it parametric
//         // ...
//         // 
//     }
// }