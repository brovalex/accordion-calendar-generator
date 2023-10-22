import fs from 'fs'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

export default class OutputPDF {

    constructor(cal, filename) {
        const svgCode = cal.svgCode
        var doc = new PDFDocument({
            size: [cal.paper.width*72, cal.paper.height*72],
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
                    else return color
                    // TEMP: I use this in svgCalendar.js to the arrays, keeping it here just in case colors change and I need to update them above
                    // for (let SVGColor in this.colors.colors) {
                    //     console.log(this.colors.colors[SVGColor].toRgb(), [this.colors.colors[SVGColor].cmyk().c,this.colors.colors[SVGColor].cmyk().m,this.colors.colors[SVGColor].cmyk().y,this.colors.colors[SVGColor].cmyk().k])
                    // }
                }
            })
        
        doc.font('Courier').fillColor([0,0,0,25]).text(filename,72,18)
        
            var filename = filename
            var stream = fs.createWriteStream(filename)
            
            stream.on('finish', function() {
                console.log('Created file '+filename)
            })
            
            doc.pipe(stream)
            doc.end()
    }
}