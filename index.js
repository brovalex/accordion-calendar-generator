import { Command } from 'commander';
import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'
import OutputPDF from './Classes/outputPDF.js'
import config from 'config';

const program = new Command();

function init() {
    program
        .name('calendar-svg')
        .description('Generate calendar SVG and PDF files')
        .version('1.0.0')
        .requiredOption('--start-year <year>', 'year to start on (e.g., 2025)', (value) => {
            const year = parseInt(value);
            if (isNaN(year) || year < 1900 || year > 2100) {
                throw new Error('start-year must be a valid year between 1900 and 2100');
            }
            return year;
        })
        .requiredOption('--start-month <month>', 'month to start on (1-12, jan-dec, january-december)', (value) => {
            const monthMap = {
                'jan': 1, 'january': 1,
                'feb': 2, 'february': 2,
                'mar': 3, 'march': 3,
                'apr': 4, 'april': 4,
                'may': 5,
                'jun': 6, 'june': 6,
                'jul': 7, 'july': 7,
                'aug': 8, 'august': 8,
                'sep': 9, 'september': 9,
                'oct': 10, 'october': 10,
                'nov': 11, 'november': 11,
                'dec': 12, 'december': 12
            };
            
            const lowerValue = value.toLowerCase();
            if (monthMap[lowerValue]) {
                return monthMap[lowerValue];
            }
            
            const month = parseInt(value);
            if (isNaN(month) || month < 1 || month > 12) {
                throw new Error('start-month must be 1-12 or month name (e.g., jan, january)');
            }
            return month;
        })
        .requiredOption('--template <template>', 'calendar template (pocket, purse, mathias)', (value) => {
            const templates = config.get('templates');
            if (!templates[value]) {
                throw new Error(`template must be one of: ${Object.keys(templates).join(', ')}`);
            }
            return value;
        })
        .requiredOption('--week-start <day>', 'first day of week (sunday/sun/0, monday/mon/1, tuesday/tue/2, wednesday/wed/3, thursday/thu/4, friday/fri/5, saturday/sat/6)', (value) => {
            const dayMap = {
                'sunday': 0, 'sun': 0, '0': 0,
                'monday': 1, 'mon': 1, '1': 1,
                'tuesday': 2, 'tue': 2, '2': 2,
                'wednesday': 3, 'wed': 3, '3': 3,
                'thursday': 4, 'thu': 4, '4': 4,
                'friday': 5, 'fri': 5, '5': 5,
                'saturday': 6, 'sat': 6, '6': 6
            };
            
            const lowerValue = value.toLowerCase();
            if (dayMap.hasOwnProperty(lowerValue)) {
                return parseInt(dayMap[lowerValue]);
            } else if (dayMap.hasOwnProperty(value)) {
                return parseInt(dayMap[value]);
            } else {
                throw new Error('week-start must be a day name (sunday-saturday), abbreviation (sun-sat), or number (0-6)');
            }
        })
        .requiredOption('--paper-size <size>', 'paper size', (value) => {
            const paperSizes = config.get('paperSizes');
            if (!paperSizes[value]) {
                throw new Error(`paper-size must be one of: ${Object.keys(paperSizes).join(', ')}`);
            }
            return value;
        })
        .option('--number-of-months <count>', 'number of months to generate', '12', (value) => {
            const count = parseInt(value);
            if (isNaN(count) || count < 1 || count > 60) {
                throw new Error('number-of-months must be between 1 and 60');
            }
            return count;
        });

    program.parse();
    const options = program.opts();

    const settings = new Settings({
        startYear: options.startYear,
        startMonth: options.startMonth,
        numberOfMonths: options.numberOfMonths,
        template: options.template,
        weekStart: options.weekStart,
        paperSize: options.paperSize
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log("Year to start on: ", settings.start.year,
                "\nMonth to start on: ", settings.start.month,
                "\nNumber of months: ", settings.number_of_months,
                "\nTemplate: ", settings.template.name,
                "\nWeek starts on: ", dayNames[settings.week_starts_on],
                "\nPaper: ", settings.paper.sizes.width + 'x' + settings.paper.sizes.height
                );

    const myCalendarData = new CalendarData(settings)
    const myCalendar = new SVGCalendar(myCalendarData, settings.template)
    const dayNamesLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const filename = './output/calendar-'+settings.template.name+'-'+settings.start.year+'-'+settings.start.month+'-'+dayNamesLower[settings.week_starts_on]+'-'+settings.paper.sizes.width+'x'+settings.paper.sizes.height+'('+Math.round(settings.paper.sizes.width*25.4*100)/100+'x'+Math.round(settings.paper.sizes.height*25.4*100)/100+')-'+settings.number_of_months+'months'+'.pdf' //'calendar.pdf' //
    const myPDFfile = new OutputPDF(myCalendar, filename)
}
init()