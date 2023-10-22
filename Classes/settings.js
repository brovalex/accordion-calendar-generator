export default class Settings {
    // node calendar.js start_year start_month number_of_months template week_starts_on paperSize
    // node index-structure.js 2023 1 12 pocket 1 letter
    // eventually replace with API request parameters
    constructor (myArgs) {
        const templates = {
            biggin: {
                name: "biggin", 
                width: 7.75, 
                height: 5.25-1/8, 
                fonts: {
                    WeekNumber: {
                        size: 8,
                        yShift: 0
                    },
                    Days: {
                        size: 16, 
                        yShift: 0
                    },
                    DaysOfWeek: {
                        size: 8, 
                        yShift: 0
                    },
                    MonthHeader: {
                        size: 30, 
                        yShift: 4.2
                    }
                }
            },
            pocket: {
                name: "pocket", 
                width: 5.5, 
                height: 3.5-1/8, 
                fonts: {
                    WeekNumber: {
                        size: 6,
                        yShift: 0
                    },
                    Days: {
                        size: 12, 
                        yShift: 0
                    },
                    DaysOfWeek: {
                        size: 6, 
                        yShift: 0
                    },
                    MonthHeader: {
                        size: 25, 
                        yShift: 3.5
                    }
                }
            }
        }
        const paperSizes = {
            roll: {
                width: 12,
                height: "roll" // TODO a more elegant way is to say null, i.e. there is no height limit
            },
            strip: {
                width: 7,
                height: 42
            },
            letter: {
                width: 11, 
                height: 8.5
            }
        }
        // todo: catch errors, eg template name not found
        this.start = {year: myArgs[0], month: myArgs[1]} // 1 = january, I usually start on December the year before, and end on the January the year after
        this.number_of_months = myArgs[2] 
        switch(myArgs[4]){
            case 'mon':
            case 'monday':
                this.week_starts_on = 1
                break
            case 'sun':
            case 'sunday':
                this.week_starts_on = 0
                break
            default:
                this.week_starts_on = (myArgs[4]%7)
        }
        this.showMonthTracker = (this.week_starts_on == 1) ? true : false
        this.template = templates[myArgs[3]]
        this.paper = paperSizes[myArgs[5]]
        this.paper.margin = 0.5
        this.paper.bleed = 0.125
        if (isNaN(this.paper.height)) this.paper.height = this.template.height*this.number_of_months+2*this.paper.margin+2*this.paper.bleed
        this.paper.availHeight = this.paper.height-2*this.paper.margin
        this.paper.availWidth = this.paper.width-2*this.paper.margin
    }
}