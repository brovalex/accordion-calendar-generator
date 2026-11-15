import fs from 'fs'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

// Fallback for any colour not in the explicit table below, so nothing is left as RGB.
// Input/output follow svg-to-pdfkit's colorCallback shape: [[r,g,b], opacity] -> [[c,m,y,k (0-100)], opacity]
function rgbToCmyk(color) {
    const rgb = color && color[0]
    if (!Array.isArray(rgb) || rgb.length < 3) return color
    const [r, g, b] = rgb.map(v => v / 255)
    const k = 1 - Math.max(r, g, b)
    if (k >= 1) return [[0, 0, 0, 100], color[1]]
    const pct = v => Math.round(v * 10000) / 100
    return [[
        pct((1 - r - k) / (1 - k)),
        pct((1 - g - k) / (1 - k)),
        pct((1 - b - k) / (1 - k)),
        pct(k)
    ], color[1]]
}

export default class OutputPDF {

    constructor(cal, filename) {
        const svgCode = cal.svgCode
        var doc = new PDFDocument({
            size: [cal.paper.sizes.width*72, cal.paper.sizes.height*72],
            autoFirstPage: false,
            margins : { // by default, all are 72
                top:    0,
                bottom: 0,
                left:   0,
                right:  0
            }
        })

        PDFDocument.prototype.addSVG = function(svg, x, y, options) {
            return SVGtoPDF(this, svg, x, y, options), this;
        };
        doc.addPage()

        doc.addSVG(
            svgCode, 
            0, 
            0, 
            {
                assumePt: true,
                colorCallback: function(color) {
                    //TODO: rewrite this to use myColors.js but works for now
                    if( color[0][0]==255 && color[0][1] == 0 && color[0][2] == 255) return [ [ 0, 100, 0, 0 ], 1]
                    else if( color[0][0]==0 && color[0][1] == 0 && color[0][2] == 0) return [ [ 0, 0, 0, 100 ], 1]
                    else if( color[0][0]==64 && color[0][1] == 64 && color[0][2] == 64) return [ [ 0, 0, 0, 75 ], 1]
                    else if( color[0][0]==128 && color[0][1] == 128 && color[0][2] == 128) return [ [ 0, 0, 0, 50 ], 1]
                    else if( color[0][0]==191 && color[0][1] == 191 && color[0][2] == 191) return [ [ 0, 0, 0, 25 ], 1]
                    else if( color[0][0]==247 && color[0][1] == 247 && color[0][2] == 247) return [ [ 0, 0, 0, 3 ], 1]
                    else if( color[0][0]==217 && color[0][1] == 217 && color[0][2] == 217) return [ [ 0, 0, 0, 15 ], 1]
                    else if( color[0][0]==237 && color[0][1] == 237 && color[0][2] == 237) return [ [ 0, 0, 0, 7 ], 1]
                    else return rgbToCmyk(color)
                    // TEMP: I use this in svgCalendar.js to the arrays, keeping it here just in case colors change and I need to update them above
                    // for (let SVGColor in this.colors.colors) {
                    //     console.log(this.colors.colors[SVGColor].toRgb(), [this.colors.colors[SVGColor].cmyk().c,this.colors.colors[SVGColor].cmyk().m,this.colors.colors[SVGColor].cmyk().y,this.colors.colors[SVGColor].cmyk().k])
                    // }
                }
            })
        
        doc.font('Courier').fontSize(8).fillColor([0,0,0,25]).text(filename, 72, 18)
        
            var filename = filename
            var stream = fs.createWriteStream(filename)
            
            stream.on('finish', function() {
                console.log('Created file '+filename)
            })
            
            doc.pipe(stream)
            doc.end()
    }
}