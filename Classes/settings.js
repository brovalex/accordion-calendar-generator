import config from 'config';

const templates = config.get('templates');
const paperSizes = config.get('paperSizes');
const fonts = config.get('fonts');

export default class Settings {
    constructor (myArgs) {
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
        this.paper = {};
        this.paper.sizes = paperSizes[myArgs[5]]
        this.paper.margin = 0.5
        this.paper.bleed = 0.125
        this.paper.sizes = {...this.paper.sizes}; // Create a new object to avoid mutating config
        if (this.paper.sizes.height === null) this.paper.sizes.height = this.template.height*this.number_of_months+2*this.paper.margin+2*this.paper.bleed
        this.paper.availHeight = this.paper.sizes.height-2*this.paper.margin
        this.paper.availWidth = this.paper.sizes.width-2*this.paper.margin
        this.fonts = fonts
    }
}