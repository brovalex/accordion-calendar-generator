import { Color as SVGcolor } from '@svgdotjs/svg.js'

export default class MyColors {
    // usign american spelling for "colour" and "grey" only because that's how it's spelled in javascript and css
    constructor() {
        //pink
        this.magenta = new SVGcolor({ c: 0, m: 255, y: 0, k:0 })
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
// pink
// if( color[0][0]==255 && color[0][1]==192 && color[0][2]==203 ) {
//     return [[0,100,0,0],1]
//     return color
// }
// // black
// else if( color[0][0]==0 && color[0][1]==0 && color[0][2]==0 ) {
//     return [[0,0,0,100],1]
//     return color
// } 
// // grey
// else if( color[0][0]==128 && color[0][1]==128 && color[0][2]==128 ) {
//     return [[0,0,0,50],1]
//     return color
// } 
// // lightgrey
// else if( color[0][0]==211 && color[0][1]==211 && color[0][2]==211 ) {
//     return [[0,0,0,25],1]
//     return color
// } 
// // fake aliceblue 240,248,255 for #eeeee very light grey 
// else if( color[0][0]==240 && color[0][1]==248 && color[0][2]==255 ) {
//     return [[0,0,0,3],1]
//     return color
// } 
// // fake aqua 0,255,255 for charcoal 
// else if( color[0][0]==0 && color[0][1]==255 && color[0][2]==255 ) {
//     return [[0,0,0,75],1]
//     return color
// } 