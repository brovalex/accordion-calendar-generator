//TODO:
//- [ ] day numbers are not properly aligned to right
//- [ ] weekend block is drawn on 6th day, need to make dynamic based on day
//- [ ] add CMYK colours, e.g. fill="#CD853F device-cmyk(0.11, 0.48, 0.83, 0.00)", 
//      in SVGtoPDF there is an option colorCallback [function] = function called to get color, making mapping to CMYK possible
//- [ ] make line adjustment dynamic or try baseline: anchor: Anchor of object in coordinate. (default: 'left baseline') ... (left, center, right) + (baseline, top, middle, bottom)
//- [ ] set colours: grey,pink,lightgrey,black,very light grey (#eeeeee)
// settings:
cal_w = 5.5*72
page_hPadding = 3/16*72
page_w = cal_w-2*page_hPadding
page_h = 3.5*72
bleed = 1/8*72
padding_x = 1/16*72
padding_y = 1/16*72
var cal = {
    paper_w: 8.5,
    paper_h: 11, //26
    paper_margin: 0.5
}

const dateFns = require('date-fns');

// returns a window with a document and an svg root node
const window   = require('svgdom')
const SVG      = require('svg.js')(window)
const document = window.document

// pdf
var fs = require('fs'),
    PDFDocument = require('pdfkit'),
    SVGtoPDF = require('svg-to-pdfkit');
var doc = new PDFDocument({
    size: [cal.paper_w*72, cal.paper_h*72],
    autoFirstPage: false,
  }),
    stream = fs.createWriteStream('file.pdf')

// outlining
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync('ProximaNova-Regular.otf');

// INPUTS
var start = {year: 2018, month: 12} // 1 = january
var number_of_months = 14
var weekStartsOn = 1 // Monday
// PREP
var maxPages = Math.floor((cal.paper_h-cal.paper_margin*2)*72/page_h)
var start_date = new Date(start.year, start.month-1, 1)
var end_date = dateFns.lastDayOfMonth(dateFns.addMonths(start_date,number_of_months-1))

// CREATE CALENDAR DATA
var calStart = dateFns.startOfWeek(start_date,{weekStartsOn:weekStartsOn})
var calEnd   = dateFns.endOfWeek(end_date,{weekStartsOn:weekStartsOn})
var daysOfWeek = [...Array(7).keys()].map((d)=>{return dateFns.format(dateFns.addDays(dateFns.startOfWeek(start_date,{weekStartsOn:weekStartsOn}),d),'ddd')})
var calDays = dateFns.eachDay(calStart, calEnd)
var calWeeks = ((days) => {
	calWeeks = []
	while (days.length) {
		calWeeks.push(days.splice(0, 7));
	}
	return calWeeks
})(calDays)
var calPages = ((weeks) => {
	calPages = [[]]
	var i = 0, j=0
	while (i < weeks.length) {
		// if day0 > day6 (e.g. 28 > 4) then it's last week of month which is carried over to next month
		isLastWeek = dateFns.getDate(weeks[i][0]) > dateFns.getDate(weeks[i][6])
		// if day0 is on 1st OR if last week but not first or last week then next page
		if(dateFns.isFirstDayOfMonth(weeks[i][0]) || (isLastWeek && i!=0 && i!=weeks.length-1)) {
			j+=1
			calPages[j]=[]
		}
		calPages[j].push(weeks[i])
		i++
	}
	return calPages
})(calWeeks)

// MAKE SVG
var dataSVG = (page_i,calendar=calPages) => {
    // create svg.js instance
    const draw = SVG(document.documentElement)//.size(300,300)

    var main = draw.group()

    var clipRect = draw.rect(cal.paper_margin*72+page_w+2*bleed,maxPages*page_h+2*bleed).fill('blue').move(-bleed,-bleed)
    var clip = draw.clip().add(clipRect)

    var group = main.group()
    var margins = main.group()
    
    // FUNCTIONS
    // Drawing
    var writeDay = (d,x,y) => {
        options = {anchor: 'left baseline', fontSize: 12}
        adjustment=textToSVG.getMetrics(d, options)
        // console.log(adjustment)
        var day = group.path(textToSVG.getD(d, options))
                    .move(x+padding_x, y+padding_y)//y-adjustment.height+18+padding_y)
    }
    var writeDays = (days,m,n,wks) => {
        h = page_h / wks
        days.forEach((d,j)=>{
            writeDay(dateFns.format(d,'D'),(j)*page_w/7,m*page_h+n*h+(n==0?12:0))//+padding_y
        })
    }
    var writeDaysOfWeek = (m) => {
        options = {fontSize: 12}
        daysOfWeek.forEach((d,j)=>{
            adjustment=textToSVG.getMetrics(d.toUpperCase(), options)
            var wDay = group.path(textToSVG.getD(d.toUpperCase(), options))
                        .move(j*page_w/7+padding_x, m*page_h+padding_y)//m*page_h-adjustment.height+18+padding_y)
        })
    }
    var writeMonthHeader = (m,mmmm,wks) => {
        h = page_h / wks
        options = {fontSize: 24}
        adjustment=textToSVG.getMetrics(mmmm, options)
        var month = group.path(textToSVG.getD(mmmm, options))
                    .move(padding_x, m*page_h+h-padding_y-adjustment.ascender)
    }
    var writeWeekNumber = (w,m,n,wks) => {
        h = page_h / wks
        options = {fontSize: 8}
        adjustment=textToSVG.getMetrics((n==1?"Week ":"") + w, options)
        var week = group.path(textToSVG.getD((n==1?"Week ":"") + w, options))
            .move(padding_x, m*page_h+(n+1)*h-padding_y-adjustment.ascender)
    }
    var drawWeekline = (m,n,wks) => {
        h = page_h / wks
        tip = 1/16*72
        var rect = group.rect(page_w-2*(padding_x-tip), 1).attr({ 
            x: padding_x-tip, 
            y: m*page_h+(n+1)*h
         }).fill(n+1==wks?'pink':'grey')
    }
    var drawDayLine = (d) => {
        var h = group
                .rect(1, page_h*number_of_months+2*bleed)
                .move(d*page_w/7,-bleed)
                .fill('lightgrey')
    }
    var drawWeekend = () => {
        var h = group
                .rect(2*page_w/7+page_hPadding+bleed, page_h*number_of_months+2*bleed)
                .move(5*page_w/7,-bleed)
                .fill('#eeeeee')
    }
    var drawCropMarks = () => {
        var cropMark = draw.symbol()
        var h1 = cropMark.rect(36, 1).attr({ 
            x: -42, 
            y: -1
        }).fill('black')
        var v1 = cropMark.rect(1, 36).attr({ 
            x: -1, 
            y: -42
        }).fill('black')
       
        // var test = margins.rect(1, 360).attr({ 
        //     x: cal_w, 
        //     y: 0
        // }).fill('red')
        // var test = margins.rect(1, 360).attr({ 
        //     x: -1, 
        //     y: 0
        // }).fill('red')

        var topLeft = margins.use(cropMark).move(0, 0)
        var topRight = margins.use(cropMark).rotate(90,0,0).move(0, -cal_w)

        var bottomRight = margins.use(cropMark).rotate(180,0,0).move(-cal_w, -maxPages*page_h)
        var bottomLeft = margins.use(cropMark).rotate(270,0,0).move(-maxPages*page_h, 0)

        var lip1 = margins.rect(36, 1).attr({ 
            x: -42, 
            y: maxPages*page_h+4/16*72
        }).fill('grey')
        var lip1 = margins.rect(36, 1).attr({ 
            x: cal_w+bleed-3,
            y: maxPages*page_h+4/16*72
        }).fill('grey')
    }

    // SET UP FILE  
    main.move(cal.paper_margin*72,cal.paper_margin*72)
    group.move(page_hPadding,0)
    drawCropMarks()
    drawWeekend()
    for(i=1;i<7;i++) drawDayLine(i)
    // GENERATE ALL THE THINGS
    for(var p=0; p < calendar.length; p++) {
        page = calendar[p]
        // for each week in page _p_
        for(var w=0; w < page.length; w++) {
            week = page[w]
            drawWeekline(p,w,page.length)
            writeDays(week,p,w,page.length)
            if(w!=0) writeWeekNumber(dateFns.getISOWeek(week[3]),p,w,page.length)
        }
        // write these after to be on top
        writeMonthHeader(p, dateFns.format(page[0][6],'MMMM'), page.length)
        writeDaysOfWeek(p)
    }
    group.clipWith(clip)

    //moving for next pages
    group.move(page_hPadding,-page_i*maxPages*page_h)
    clipRect.move(0,page_i*maxPages*page_h-bleed)

    // get your svg as string
    // console.log(draw.svg())
    // or
    // console.log(draw.node.outerHTML)

    // for debug
    // fs.writeFile("test"+page_i+".svg", draw.node.outerHTML, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }    
    //     console.log("Also made you a svg <3");
    // }); 

    var cleanSVG = (data) => {
        var returndata = data.replace(/(<svg.*?>)<svg.*?>(.*?)<\/svg>/g, '$1')
        main.clear()
        return returndata
    }
    return cleanSVG(draw.node.outerHTML)
}


// console.log(cleanSVG)

PDFDocument.prototype.addSVG = function(svg, x, y, options) {
    return SVGtoPDF(this, svg, x, y, options), this;
    };

for(var page_i=0; page_i < Math.ceil(number_of_months/maxPages); page_i++) {
    // if(page_i>0) doc.addPage()//.addSVG(cleanSVG, 0*cal.paper_margin*72, 0*cal.paper_margin*72);
    console.log("Page "+(page_i+1)+" of "+Math.ceil(number_of_months/maxPages))
    doc.addPage()
    doc.addSVG(dataSVG(page_i), 0*cal.paper_margin*72, 0*cal.paper_margin*72, {assumePt: true});
}

stream.on('finish', function() {
  console.log(fs.readFileSync('calendar.pdf'))
})

doc.pipe(stream)
doc.end()