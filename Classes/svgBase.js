import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
import TextToSVG from 'text-to-svg'
import MyColors from './myColors.js'

// Shared machinery for every layout: fonts, colours, SVG canvas, and the printer's marks
// (bleed, crop marks, fold marks). A layout subclass draws its pages into this.mainGroup
// and then calls this.finish().
export default class SVGBase {
    constructor (calData, template) {
        this.template = template
        this.paper = calData.paper
        this.fonts = calData.fonts
        this.across = calData.preset?.arrange === 'across' // pages side by side instead of stacked

        // outlining fonts
        this.textToSVG = TextToSVG.loadSync(calData.fonts.textFont.file);
        this.monthToSVG = TextToSVG.loadSync(calData.fonts.monthFont.file);
        this.digitsToSVG = TextToSVG.loadSync(calData.fonts.digitsFont.file);
        this.weeksToSVG = TextToSVG.loadSync(calData.fonts.weeksFont.file);

        this.colors = new MyColors()
        const window = createSVGWindow()
        const document = window.document

        // register window and document
        registerWindow(window, document)

        // create canvas
        this.draw = SVG(document.documentElement)
        this.mainGroup = this.draw.group()
        this.printerMarks = this.draw.group()
    }
    // call once all pages are drawn into this.mainGroup
    finish = (pagesCount) => {
        this.mainGroup.move( this.inchToPx(this.paper.margin), this.inchToPx(this.paper.margin))
        this.drawFoldLines(this.printerMarks, pagesCount)
        this.drawCropMarks(this.printerMarks, this.mainGroup.width(), this.mainGroup.height())
        this.svgCode = this.cleanSVG(this.draw.node.outerHTML) //note: svg.js create parser <svg> node inside the <svg> which then breaks svg-to-pdfkit, so I'm taking it out here
    }
    inchToPx = (x) => {
        return x*72
    }
    cleanSVG = (data) => {
        var returndata = data.replace(/(<svg.*?>)<svg.*?>(.*?)<\/svg>/g, '$1')
        // main.clear()
        return returndata
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
        if (this.across) return this.drawFoldLinesAcross(svg, pagesCount)
        ;[...Array(pagesCount+1)].forEach((_,i) => {
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
                x: this.inchToPx(this.paper.sizes.width)-l,
                y: y
                }).fill( this.colors.lightgray )
        })
    }
    // same marks turned a quarter: pages sit side by side, so the folds are vertical ticks above and below the artwork
    drawFoldLinesAcross = (svg, pagesCount) => {
        [...Array(pagesCount+1)].forEach((_,i) => {
            const l=this.inchToPx(1/2)
            const zeroH= this.inchToPx(this.paper.margin)
            const zeroY= this.inchToPx(this.paper.margin)
            const t=1
            const x=zeroH + i*this.inchToPx(this.template.width) + this.inchToPx(this.paper.bleed) - t/2

            svg.rect(t, l).attr({ x: x, y: zeroY - l }).fill( this.colors.lightgray )
            svg.rect(t, l).attr({ x: x, y: zeroY + this.inchToPx(this.template.height) + 2*this.inchToPx(this.paper.bleed) }).fill( this.colors.lightgray )
            svg.rect(t, l).attr({ x: x, y: this.inchToPx(this.paper.sizes.height)-l }).fill( this.colors.lightgray )
        })
    }
}
