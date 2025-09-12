import config from 'config';

const templates = config.get('templates');
const paperSizes = config.get('paperSizes');
const fonts = config.get('fonts');

export default class Settings {
    constructor (options) {
        this.start = {year: options.startYear, month: options.startMonth}
        this.number_of_months = options.numberOfMonths
        this.week_starts_on = options.weekStart
        this.showMonthTracker = (this.week_starts_on == 1) ? true : false
        this.template = templates[options.template]
        this.paper = {};
        this.paper.sizes = paperSizes[options.paperSize]
        this.paper.margin = options.margin ?? 0.5
        this.paper.bleed = 0.125
        this.paper.sizes = {...this.paper.sizes}; // Create a new object to avoid mutating config
        if (this.paper.sizes.height === null) this.paper.sizes.height = this.template.height*this.number_of_months+2*this.paper.margin+2*this.paper.bleed
        this.paper.availHeight = this.paper.sizes.height-2*this.paper.margin
        this.paper.availWidth = this.paper.sizes.width-2*this.paper.margin
        this.fonts = fonts
    }
}