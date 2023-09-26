import fs from 'fs'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

export default class OutputPDF {

    constructor(cal, template) {
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

        // TEMP
        // fs.writeFile('output.svg', svgCode, (err) => {
        //     if (err) {
        //         console.error('Error writing to file:', err);
        //     } else {
        //         console.log('Data has been written to the file.');
        //     }
        // });

        PDFDocument.prototype.addSVG = function(svg, x, y, options) {
            return SVGtoPDF(this, svg, x, y, options), this;
        };
        doc.addPage()

        doc.addSVG(
            svgCode, 
            0, 
            0, 
            {
                assumePt: true, //TODO: this might need to be false, pdf point is 1.33 pixel
                // colorCallback: function(color) {
                //     // pink
                //     if( color[0][0]==255 && color[0][1]==192 && color[0][2]==203 ) {
                //         return [[0,100,0,0],1]
                //         return color
                //     }
                //     // black
                //     else if( color[0][0]==0 && color[0][1]==0 && color[0][2]==0 ) {
                //         return [[0,0,0,100],1]
                //         return color
                //     } 
                //     // grey
                //     else if( color[0][0]==128 && color[0][1]==128 && color[0][2]==128 ) {
                //         return [[0,0,0,50],1]
                //         return color
                //     } 
                //     // lightgrey
                //     else if( color[0][0]==211 && color[0][1]==211 && color[0][2]==211 ) {
                //         return [[0,0,0,25],1]
                //         return color
                //     } 
                //     // fake aliceblue 240,248,255 for #eeeee very light grey 
                //     else if( color[0][0]==240 && color[0][1]==248 && color[0][2]==255 ) {
                //         return [[0,0,0,3],1]
                //         return color
                //     } 
                //     // fake aqua 0,255,255 for charcoal 
                //     else if( color[0][0]==0 && color[0][1]==255 && color[0][2]==255 ) {
                //         return [[0,0,0,75],1]
                //         return color
                //     } 
                //     else {
                //         return color
                //     }
                // }
            });
        
            var filename = 'calendar.pdf' //'calendar-'+template+'-'+start.year+'-'+daysOfWeek[(weekStartsOn==7)?0:weekStartsOn-1]+'-'+cal.paper_w+'x'+cal.paper_h+'.pdf'
            var stream = fs.createWriteStream(filename)
            
            stream.on('finish', function() {
                console.log('Created file '+filename)
            })
            
            doc.pipe(stream)
            doc.end()
    }
}