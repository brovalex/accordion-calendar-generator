import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
import * as dateFns from 'date-fns'
import TextToSVG from 'text-to-svg'
import MyColors from './myColors.js'

console.log("-------------------------------------------")

export default class SVGCalendar {
    // intention: object containing printable pages (not calendar pages)
    // I'm combining calendar pages with printed pages because of bleed

    constructor (calData, template) {
        this.template = template
        // Settings specfic to visual design
        this.spacing_x = 1/8 //default spacing
        this.spacing_y = 1/16
        this.padding_x = 2*this.spacing_x //margins in the design
        this.paper = calData.paper
        this.effectiveWidth = this.template.width-2*this.padding_x

        // outlining fonts
        this.textToSVG = TextToSVG.loadSync('fonts/nimbus bold 724726a7-b3d6-4c01-ac68-73ef3673e3e1.ttf');
        this.monthToSVG = TextToSVG.loadSync('fonts/nimbus 1 - dc9d32c4-6c53-4bb1-8bef-4cd396bee3ce.ttf');
        this.digitsToSVG = TextToSVG.loadSync('fonts/nimbus mono d7dfb1f6-0918-41e9-a9d2-bf7241c11fae.ttf');
        this.weeksToSVG = TextToSVG.loadSync('fonts/nimbus regular a70c1179-4a1d-4887-8eb1-d4f6ce17cfb4.ttf');

        this.colors = new MyColors()
        const window = createSVGWindow()
        const document = window.document
        
        // register window and document
        registerWindow(window, document)
        
        // create canvas
        const draw = SVG(document.documentElement)
        const mainGroup = draw.group()
        const printerMarks = draw.group()

        // note: elements order in svg follows the order they appear in the document
        this.drawWeekend(mainGroup, calData.weekStartsOn, calData.pages.length)
        this.drawDayLines(mainGroup, calData.pages.length)

        calData.pages.forEach( (page,p) => {
            const pageGroup = mainGroup.group()

            //TODO fix this otherwise
            var homeCoord = pageGroup
            .rect( 0,0 )
            .move( 0,0 )
            .fill( "white" )
            // per week stuff
            page.forEach( (week, w) => {
                this.drawWeekline(pageGroup, w, page.length)
                this.writeDays(pageGroup, week, w, page.length)
                this.writeWeekNumber(pageGroup, dateFns.getISOWeek(week[3]), w, page.length)
            })

            //per page stuff
            this.writeMonthHeader(pageGroup, dateFns.format(page[0][6],'MMMM'), page.length)
            this.writeDaysOfWeek(pageGroup, calData.daysOfWeek)
            
            pageGroup.move( 0, this.inchToPx(this.template.height*p) )
        })
        
        mainGroup.move( this.inchToPx(calData.paper.margin), this.inchToPx(calData.paper.margin))
        this.drawFoldLines(printerMarks, calData.pages.length)
        this.drawCropMarks(printerMarks, mainGroup.width(), mainGroup.height())
        this.svgCode = this.cleanSVG(draw.node.outerHTML) //note: svg.js create parser <svg> node inside the <svg> which then breaks svg-to-pdfkit, so I'm taking it out here
    }
    inchToPx = (x) => {
        return x*72
    }
    cleanSVG = (data) => {
        var returndata = data.replace(/(<svg.*?>)<svg.*?>(.*?)<\/svg>/g, '$1')
        // main.clear()
        return returndata
    }
    drawWeekend = (svg, weekStartsOn, pagesCount) => {
        //TODO fix this otherwise
        var homeCoord = svg
        .rect( 0,0 )
        .move( -this.inchToPx(this.paper.bleed),0 )
        .fill( this.colors.magenta )

        var colW = (weekStartsOn>0) ? 2 : 1
        //TODO this should be reusable, many other places use this
        var dayW = this.inchToPx(this.effectiveWidth)/7
            svg
                .rect( colW * dayW + this.inchToPx(this.padding_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( (7+6-weekStartsOn)%7 * dayW + this.inchToPx(this.padding_x), -this.inchToPx(this.paper.bleed))
                .fill( this.colors.verylightgray )
        if (colW == 1) {
            svg
                .rect( colW * dayW + this.inchToPx(this.padding_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( (7-weekStartsOn)%7 * dayW -this.inchToPx(this.paper.bleed), -this.inchToPx(this.paper.bleed) )
                .fill( this.colors.verylightgray )
        }
        // left "tracker" on Monday starts
        if (colW == 2) {
            svg
                .rect( this.inchToPx(this.spacing_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( -this.inchToPx(this.paper.bleed), -this.inchToPx(this.paper.bleed) )
                .fill( this.colors.verylightgray )
        }
    }
    drawDayLines = (svg, pagesCount) => {
        var drawDayLine = (d) => {
            svg
                .rect(0.5, pagesCount * this.inchToPx(this.template.height) )
                .move(this.inchToPx(this.padding_x) + d*this.inchToPx(this.effectiveWidth)/7, 0)
                .fill( this.colors.lightgray )
        }
        [...Array(6)].forEach( (_,d) => {
            drawDayLine(d+1)
        })
    }
    drawWeekline = (pG, n, wks) => {
        const h = this.template.height / wks
        const thickness = 1/72
        pG
            .rect( this.inchToPx(this.template.width - 2*this.padding_x), this.inchToPx(thickness) )
            .move( this.inchToPx(this.padding_x), this.inchToPx((n+1)*h - thickness/2) )
            .fill( this.colors.magenta )
    }
    writeWeekNumber = (pG, w, n, wks) => {
        const h = this.template.height / wks // TODO: this is repeated, could be isolated
        var options = {fontSize: this.template.fonts.WeekNumber.size}
        var weekString = (n==0?"": ((n==1?"Week ":"") + w) )

        var adjustment = this.weeksToSVG.getMetrics(weekString, options)
        pG
            .path( this.weeksToSVG.getD(weekString, options) )
            .move( this.inchToPx(this.padding_x+this.spacing_x/2), this.inchToPx( (n+1)*h)-adjustment.ascender-this.inchToPx(this.spacing_y)/2)
            .fill( this.colors.gray )
    }
    writeDays = (pG,days,n,wks) => {
        var writeDay = (d,x,y) => {
            var options = {anchor: 'left baseline', fontSize: this.template.fonts.Days.size}
            pG
                .path(this.digitsToSVG.getD(d, options))
                .move( x+this.inchToPx(this.spacing_x)/2, y+this.inchToPx(this.spacing_y) )
                .fill( this.colors.darkgray )
        }
        days.forEach((d,j)=>{
            writeDay(
                dateFns.format(d,'d'),
                this.inchToPx(this.padding_x)+(j)*this.inchToPx(this.effectiveWidth)/7,
                this.inchToPx(this.template.height)/wks*n
                )
        })
    }
    writeDaysOfWeek = (pG, daysOfWeek) => {
        var options = {anchor: 'right baseline', fontSize: this.template.fonts.DaysOfWeek.size}
        daysOfWeek.forEach((d,j)=>{
            var text = d.toUpperCase()
            var textSVG = this.textToSVG.getD(text, options)
            var textMetrics = this.textToSVG.getMetrics(text, options)
            pG
                .path( textSVG )
                .move( this.inchToPx( (j+1)*(this.effectiveWidth)/7 + this.padding_x - this.spacing_x/2 ) - textMetrics.width , this.inchToPx( this.spacing_y ) )
                .fill( this.colors.lightgray )
        })
    }
    writeMonthHeader = (pG, mmmm, wks) => {
        var options = {fontSize: this.template.fonts.MonthHeader.size}
        var text = mmmm
        var textSVG = this.monthToSVG.getD(text, options)
        var textMetrics = this.monthToSVG.getMetrics(text, options)
        pG
            .path( textSVG )
            //TODO: not sure why ascender height needs to be adjusted by 5, that may break for other fonts
            .move( this.inchToPx( this.padding_x+this.spacing_x/2 ) , this.inchToPx( this.template.height / wks ) - textMetrics.ascender + this.template.fonts.MonthHeader.yShift )
            .fill( this.colors.lightgray )
    }
    drawCropMarks = (svg, svgW, svgH) => {
            const l=this.inchToPx(1/2-this.paper.bleed-1/16)
            const zeroH= this.inchToPx(this.paper.margin)
            const zeroY= this.inchToPx(this.paper.margin)
            const t=1
            const corners = [[ 1, 0],[ 0, 0],[ 0, 1],[ 1, 1]]
            const bleed =   [[-1, 1],[ 1, 1],[ 1,-1],[-1,-1]]

            corners.forEach((c,i) => {
                var vectorH = c[0]*svgW/svgW-1
                var vectorV = c[1]*svgH/svgH-1
                svg.rect(l, t).attr({ 
                    x: zeroH + c[0]*svgW + vectorH*l,
                    y: zeroY + c[1]*svgH + bleed[i][1]*this.inchToPx(this.paper.bleed) - t/2
                    }).fill('black')
                svg.rect(t, l).attr({ 
                    x: zeroH + c[0]*svgW + bleed[i][0]*this.inchToPx(this.paper.bleed), 
                    y: zeroY + c[1]*svgH + vectorV*l - t/2
                    }).fill('black')
            })
    }
    drawFoldLines = (svg, pagesCount) => {
        [...Array(pagesCount+1)].forEach((_,i) => {
            const l=this.inchToPx(1/2)
            const zeroH= this.inchToPx(this.paper.margin)
            const zeroY= this.inchToPx(this.paper.margin)
            const t=1
            const y=zeroY + i*this.inchToPx(this.template.height) + this.inchToPx(this.paper.bleed) - t/2

            svg.rect(l, t).attr({ 
                x: zeroH - l,
                y: y
                }).fill( this.colors.lightgray )
            svg.rect(l, t).attr({ 
                x: zeroH + this.inchToPx(this.template.width) + 2*this.inchToPx(this.paper.bleed),
                y: y
                }).fill( this.colors.lightgray )
            svg.rect(l, t).attr({ 
                x: this.inchToPx(this.paper.width)-l,
                y: y
                }).fill( this.colors.lightgray )
        })
    }
}