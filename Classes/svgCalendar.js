import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
import * as dateFns from 'date-fns'
import TextToSVG from 'text-to-svg'

console.log("-------------------------------------------")

export default class SVGCalendar {
    // intention: object containing printable pages (not calendar pages)
    // I'm combining calendar pages with printed pages because of bleed

    constructor (calData, template) {
        this.template = template
        // Settings specfic to visual design
        this.padding_x = 1/8
        this.padding_y = 1/16

        // outlining fonts
        this.textToSVG = TextToSVG.loadSync('fonts/nimbus bold 724726a7-b3d6-4c01-ac68-73ef3673e3e1.ttf');
        this.monthToSVG = TextToSVG.loadSync('fonts/nimbus 1 - dc9d32c4-6c53-4bb1-8bef-4cd396bee3ce.ttf');
        this.digitsToSVG = TextToSVG.loadSync('fonts/nimbus mono d7dfb1f6-0918-41e9-a9d2-bf7241c11fae.ttf');
        this.weeksToSVG = TextToSVG.loadSync('fonts/nimbus regular a70c1179-4a1d-4887-8eb1-d4f6ce17cfb4.ttf');

        const window = createSVGWindow()
        const document = window.document
        
        // register window and document
        registerWindow(window, document)
        
        // create canvas
        const draw = SVG(document.documentElement)

        // note: elements order in svg follows the order they appear in the document
        this.drawDayLines(draw, calData.pages.length)
        calData.pages.forEach( (page,p) => {
            const pageGroup = draw.group()

            //TODO fix this otherwise
            var homeCoord = pageGroup
            .rect( 0,0 )
            .move( 0,0 )
            .fill('pink') //n+1==wks?'pink':'grey'
            //
            page.forEach( (week, w) => {
                // week = page[w]
                // drawWeekline(p,w,page.length)
                this.drawWeekline(pageGroup, w, page.length)
                this.writeDays(week, pageGroup, w, page.length)
                // this.writeWeekNumber(pageGroup,w,n,wk)
                this.writeWeekNumber(pageGroup, p, dateFns.getISOWeek(week[3]), w, page.length)
            })
            pageGroup.move( 0, this.inch(this.template.height*p) )
        })
        
        this.SVGcode = draw.node.outerHTML
        // console.log("SVG for this page: ", this.SVGcode)
    }
    inch = (x) => {
        return x*72
    }
    drawWeekline = (pG, n, wks) => {
        const h = this.template.height / wks
        const thickness = 1/72
        // const tip = 1/16 //not sure why needed
        var rect = pG
                    .rect( this.inch(this.template.width - 2*(this.padding_x)), this.inch(thickness) )
                    .move( this.inch(this.padding_x), this.inch((n+1)*h - thickness/2) )
                    .fill('pink') //n+1==wks?'pink':'grey'
    }
    drawDayLines = (svg, pagesCount) => {
        var drawDayLine = (d) => {
            var rect = svg
                        .rect(0.5, pagesCount * this.inch(this.template.height) )
                        .move(d*this.inch(this.template.width)/7, 0)
                        .fill('lightgrey')
        }
        [...Array(7)].forEach( (_,d) => {
            drawDayLine(d)
        })

    }
    writeWeekNumber = (pG, p, w, n, wks) => {
        const h = this.template.height / wks // todo: this is repeated, could be isolated
        var options = {fontSize: 6}
        var weekString = (n==1?"Week ":"") + w
        // + "---" + [pG, p, w, n, wks].map(e => `${e}`).join(',')
        var adjustment = this.weeksToSVG.getMetrics(weekString, options)
        var week = pG
                    .path(this.weeksToSVG.getD(weekString, options))
                    .move( this.inch(this.padding_x)*1.5, this.inch( (n+1)*h)-adjustment.ascender-this.inch(this.padding_y)/2)
                    .fill('grey')
    }
    writeDays = (days,pG,n,wks) => {
        var writeDay = (d,x,y) => {
            var options = {anchor: 'left baseline', fontSize: 12}
            // var adjustment = this.digitsToSVG.getMetrics(d, options)
            var day = pG
                        .path(this.digitsToSVG.getD(d, options))
                        .move( x+this.inch(this.padding_x)*1.5, y+this.inch(this.padding_y) )
                        .fill('aqua')
        }
        days.forEach((d,j)=>{
            // console.log(wks)
            writeDay(
                dateFns.format(d,'d'),
                (j)*this.inch(this.template.width)/7,
                this.inch(this.template.height)/wks*n
                )
        })
    }
    
    // separate to mechanicals:
    // ... dayline (vertical, needs bleed), weekends (need bleed)
    // for each page
    //     drawMonthFoldLine(p)
    // drawMonthFoldLine = (m) => {
    //     thickness = 1
    //     var rect1 = margins.rect(0.5*72, thickness)
    //         .move(-(0.5+1/8-1/16)*72, m*page_h-thickness/2)
    //         .fill('grey')
    //     var rect2 = margins.rect(0.25*72, thickness)
    //         .move( (1/2-1/16)*72+page_w, m*page_h-thickness/2)
    //         .fill('grey')
    //     // extra line on paper edge on rigth to make scoring easier
    //     var rect3 = margins.rect(0.25*72, thickness)
    //         .move( cal.paper_w*72-(1-0.25)*72, m*page_h-thickness/2)
    //         .fill('grey')
    // }
}