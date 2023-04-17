import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
// outlining
import { TextToSVG }  from 'text-to-svg'

export default class SVGCalendar {
    // intention: object containing printable pages (not calendar pages)
    // I'm combining calendar pages with printed pages because of bleed

    constructor (calData, template) {
        this.template = template
        // Settings specfic to visual design
        this.padding_x = 1/16
        // padding_y = 1/16

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
        
        calData.pages.forEach( (page,p) => {
            const pageGroup = draw.group()
            //
            page.forEach( (week, w) => {
                // week = page[w]
                // drawWeekline(p,w,page.length)
                // writeDays(week,p,w,page.length)
                this.drawWeekline(pageGroup, w, page.length)
                // this.writeWeekNumber(pageGroup,w,n,wk)
                if(w!=0) this.writeWeekNumber(pageGroup, p, dateFns.getISOWeek(week[3]), w, page.length)
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
    writeWeekNumber = (pG, p, w, n, wks) => {
        const h = this.template.height / wks // todo: this is repeated, could be isolated
        options = {fontSize: 6}
        adjustment = this.weeksToSVG.getMetrics((n==1?"Week ":"") + w, options)
        var week = pG
                    .path(this.weeksToSVG.getD((n==1?"Week ":"") + w, options))
                    .move(padding_x, p*this.template.height+(n+1)*h-adjustment.ascender+adjustment.descender)
            .       fill('grey')
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