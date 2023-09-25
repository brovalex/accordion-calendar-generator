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
        this.padding_x = 1/8
        this.padding_y = 1/16
        this.paper = calData.paper

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
            .fill( this.colors.magenta.toRgb() )
            //
            //per page stuff
            this.writeMonthHeader(pageGroup, dateFns.format(page[0][6],'MMMM'), page.length)
            this.writeDaysOfWeek(pageGroup, calData.daysOfWeek)

            //per week stuff
            page.forEach( (week, w) => {
                this.drawWeekline(pageGroup, w, page.length)
                this.writeDays(pageGroup, week, w, page.length)
                this.writeWeekNumber(pageGroup, dateFns.getISOWeek(week[3]), w, page.length)
            })
            pageGroup.move( 0, this.inchToPx(this.template.height*p) )
        })
        
        mainGroup.move( this.inchToPx(calData.paper.margin), this.inchToPx(calData.paper.margin))
        this.drawFoldLines(printerMarks, calData.pages.length)
        this.drawCropMarks(printerMarks, mainGroup.width(), mainGroup.height())
        this.SVGcode = draw.node.outerHTML
    }
    inchToPx = (x) => {
        return x*72
    }
    drawWeekend = (svg, weekStartsOn, pagesCount) => {
        //TODO fix this otherwise
        var homeCoord = svg
        .rect( 0,0 )
        .move( -this.inchToPx(this.paper.bleed),0 )
        .fill( this.colors.magenta.toRgb() )

        var colW = (weekStartsOn>0) ? 2 : 1
        //TODO this should be reusable, many other places use this
        var dayW = this.inchToPx(this.template.width-2*this.padding_x)/7
        var h = svg
                //todo add bleed
                .rect( colW * dayW + this.inchToPx(this.padding_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( (7+6-weekStartsOn)%7 * dayW + this.inchToPx(this.padding_x), -this.inchToPx(this.paper.bleed))
                .fill( this.colors.verylightgray.toRgb() )
        if (colW == 1) {
            var h2 = svg
                .rect( colW * dayW + this.inchToPx(this.padding_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( (7-weekStartsOn)%7 * dayW -this.inchToPx(this.paper.bleed), -this.inchToPx(this.paper.bleed) )
                .fill( this.colors.verylightgray.toRgb() )
        }
        // left "tracker" on Monday starts
        if (colW == 2) {
            var h2 = svg
                .rect( this.inchToPx(this.padding_x) + this.inchToPx(this.paper.bleed), pagesCount * this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed))
                .move( -this.inchToPx(this.paper.bleed), -this.inchToPx(this.paper.bleed) )
                .fill( this.colors.verylightgray.toRgb() )
        }
    }
    drawDayLines = (svg, pagesCount) => {
        var drawDayLine = (d) => {
            var rect = svg
                        .rect(0.5, pagesCount * this.inchToPx(this.template.height) )
                        .move(this.inchToPx(this.padding_x) + d*this.inchToPx(this.template.width-2*this.padding_x)/7, 0)
                        .fill( this.colors.lightgray.toRgb() )
        }
        [...Array(6)].forEach( (_,d) => {
            drawDayLine(d+1)
        })
    }
    drawWeekline = (pG, n, wks) => {
        const h = this.template.height / wks
        const thickness = 1/72
        var rect = pG
                    .rect( this.inchToPx(this.template.width - 2*this.padding_x), this.inchToPx(thickness) )
                    .move( this.inchToPx(this.padding_x), this.inchToPx((n+1)*h - thickness/2) )
                    .fill( this.colors.magenta.toRgb() )
    }
    writeWeekNumber = (pG, w, n, wks) => {
        const h = this.template.height / wks // TODO: this is repeated, could be isolated
        var options = {fontSize: 6}
        var weekString = (n==0?"": ((n==1?"Week ":"") + w) )

        var adjustment = this.weeksToSVG.getMetrics(weekString, options)
        var week = pG
                    .path( this.weeksToSVG.getD(weekString, options) )
                    .move( this.inchToPx(this.padding_x)*1.5, this.inchToPx( (n+1)*h)-adjustment.ascender-this.inchToPx(this.padding_y)/2)
                    .fill( this.colors.gray.toRgb() )
    }
    writeDays = (pG,days,n,wks) => {
        var writeDay = (d,x,y) => {
            var options = {anchor: 'left baseline', fontSize: 12}
            var day = pG
                        .path(this.digitsToSVG.getD(d, options))
                        .move( x+this.inchToPx(this.padding_x)/2, y+this.inchToPx(this.padding_y) )
                        .fill( this.colors.darkgray.toRgb() )
        }
        days.forEach((d,j)=>{
            writeDay(
                dateFns.format(d,'d'),
                this.inchToPx(this.padding_x)+(j)*this.inchToPx(this.template.width-2*this.padding_x)/7,
                this.inchToPx(this.template.height)/wks*n
                )
        })
    }
    writeDaysOfWeek = (pG, daysOfWeek) => {
        var options = {anchor: 'right baseline', fontSize: 6}
        daysOfWeek.forEach((d,j)=>{
            var text = d.toUpperCase()
            var textSVG = this.textToSVG.getD(text, options)
            var textMetrics = this.textToSVG.getMetrics(text, options)
            var wDay = pG
                        .path( textSVG )
                        .move( this.inchToPx( (j+1)*(this.template.width-2*this.padding_x)/7 + this.padding_x - this.padding_x/2 ) - textMetrics.width , this.inchToPx( this.padding_y ) )
                        .fill( this.colors.lightgray.toRgb() )
        })
    }
    writeMonthHeader = (pG, mmmm, wks) => {
        var options = {fontSize: 25}
        var text = mmmm
        var textSVG = this.monthToSVG.getD(text, options)
        var textMetrics = this.monthToSVG.getMetrics(text, options)
        var month = pG
                    .path( textSVG )
                    //TODO: not sure why ascender height needs to be adjusted by 5, that may break for other fonts
                    .move( this.inchToPx( this.padding_x+this.padding_x/2 ) , this.inchToPx( this.template.height / wks ) - textMetrics.ascender + 5 )
                    .fill( this.colors.lightgray.toRgb() )
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
                var h = svg.rect(l, t).attr({ 
                    x: zeroH + c[0]*svgW + vectorH*l,
                    y: zeroY + c[1]*svgH + bleed[i][1]*this.inchToPx(this.paper.bleed) - t/2
                    }).fill('black')
                var v = svg.rect(t, l).attr({ 
                    x: zeroH + c[0]*svgW + bleed[i][0]*this.inchToPx(this.paper.bleed), 
                    y: zeroY + c[1]*svgH + vectorV*l - t/2
                    }).fill('black')
            })
    }
    drawFoldLines = (svg, pagesCount) => {
        [...Array(pagesCount+1)].forEach((_,i) => {
            const l=this.inchToPx(1/2-this.paper.bleed-1/16)
            const zeroH= this.inchToPx(this.paper.margin)
            const zeroY= this.inchToPx(this.paper.margin)
            const t=1
            const y=zeroY + i*this.inchToPx(this.template.height) + this.inchToPx(this.paper.bleed) - t/2

            var h1 = svg.rect(l, t).attr({ 
                x: zeroH - l,
                y: y
                }).fill('grey')
            var h2 = svg.rect(l, t).attr({ 
                x: zeroH + this.inchToPx(this.template.width) + 2*this.inchToPx(this.paper.bleed),
                y: y
                }).fill('grey')
            var h3 = svg.rect(l, t).attr({ 
                x: this.inchToPx(this.paper.width)-l,
                y: y
                }).fill('grey')
        })
    }
}