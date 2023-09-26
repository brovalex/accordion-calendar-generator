export default class Settings {
    // node calendar.js start_year start_month number_of_months template week_starts_on paperSize
    // node index-structure.js 2023 1 12 pocket 1 letter
    // eventually replace with API request parameters
    constructor (myArgs) {
        const templates = {
            biggin: {
                width: 8.25, 
                height: 5.75-1/8
            },
            pocket: {
                width: 5.5, 
                height: 3.5-1/8
            }
        }
        const paperSizes = {
            roll: {
                width: 12.5,
                height: "roll" // TODO a more elegant way is to say null, i.e. there is no height limit
            },
            strip: {
                width: 7,
                height: 42
            },
            letter: {
                width: 8.5,
                height: 11
            }
        }
        // todo: catch errors, eg template name not found
        this.start = {year: myArgs[0], month: myArgs[1]} // 1 = january, I usually start on December the year before, and end on the January the year after
        this.number_of_months = myArgs[2]        
        this.week_starts_on = (myArgs[4]%7) //1 = Monday, 7 = Sunday
        this.showMonthTracker = (this.week_starts_on == 1) ? true : false
        this.template = templates[myArgs[3]]
        this.paper = paperSizes[myArgs[5]]
        if (isNaN(this.paper.height)) this.paper.height = this.template.height*this.number_of_months
        this.paper.margin = 0.5
        this.paper.bleed = 0.125
        this.paper.availHeight = this.paper.height-2*this.paper.margin
        this.paper.availWidth = this.paper.width-2*this.paper.margin
    }
}