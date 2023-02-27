import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

export default class SVGCalendar {
    // intention: object containing printable pages (not calendar pages)
    // I'm combining calendar pages with printed pages because of bleed

    constructor (calData, template) {
        this.template = template
        // Settings specfic to visual design
        this.padding_x = 1/16
        // padding_y = 1/16

        const window = createSVGWindow()
        const document = window.document
        
        // register window and document
        registerWindow(window, document)
        
        // create canvas
        const draw = SVG(document.documentElement)
        
        calData.pages.forEach( (page,p) => {
            const pageGroup = draw.group()
            //
            page.forEach( (week, w) => {
                this.drawWeekline(pageGroup, w, page.length)
                // writeDays(week,p,w,page.length)
                // if(w!=0) writeWeekNumber(dateFns.getISOWeek(week[3]),p,w,page.length)
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
        const tip = 1/16
        var rect = pG
        .rect( this.inch(this.template.width - 2*(this.padding_x-tip)), this.inch(thickness) )
        .move( this.inch(this.padding_x-tip), this.inch((n+1)*h - thickness/2) )
        .fill('pink') //n+1==wks?'pink':'grey'
    }
    
    // separate to mechanicals:
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