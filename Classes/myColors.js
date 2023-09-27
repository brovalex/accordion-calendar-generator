import { Color as SVGcolor } from '@svgdotjs/svg.js'

export default class MyColors {
    // usign american spelling for "colour" and "grey" only because that's how it's spelled in javascript and css
    constructor() {
        // magenta (aka pink)
        this.magenta = new SVGcolor({ c: 0, m: 1.00, y: 0, k:0 })
        // black
        this.keyblack = new SVGcolor({ c: 0, m: 0, y: 0, k:1.00 })
        // dark gray aka charcoal (fake aqua)
        this.darkgray = new SVGcolor({ c: 0, m: 0, y: 0, k:0.75 })
        // gray
        this.gray = new SVGcolor({ c: 0, m: 0, y: 0, k:0.50 })
        // light gray
        this.lightgray = new SVGcolor({ c: 0, m: 0, y: 0, k:0.25 })
        // very light gray (fake aliceblue)
        this.verylightgray = new SVGcolor({ c: 0, m: 0, y: 0, k:0.03 })
    }
}