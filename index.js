import { Command } from 'commander';
import inquirer from 'inquirer';
import Settings from './Classes/settings.js'
import CalendarData from './Classes/calendarData.js'
import SVGCalendar from './Classes/svgCalendar.js'
import OutputPDF from './Classes/outputPDF.js'
import config from 'config';

const program = new Command();

// Helper functions for default values
function getDefaultYear() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    // If it's January (0), use current year, otherwise next year
    return currentMonth === 0 ? currentYear : currentYear + 1;
}

function getDefaultPaperSize(template) {
    // If template is pocket, default to strip, otherwise roll
    return template === 'pocket' ? 'strip' : 'roll';
}

// Validation functions
function validateYear(value) {
    const year = parseInt(value);
    if (isNaN(year) || year < 1900 || year > 2100) {
        return 'Year must be a valid number between 1900 and 2100';
    }
    return true;
}

function validateMonth(value) {
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
    
    const lowerValue = value.toString().toLowerCase();
    if (monthMap[lowerValue]) {
        return true;
    }
    
    const month = parseInt(value);
    if (isNaN(month) || month < 1 || month > 12) {
        return 'Month must be 1-12 or month name (e.g., jan, january)';
    }
    return true;
}

function parseMonth(value) {
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
    
    const lowerValue = value.toString().toLowerCase();
    if (monthMap[lowerValue]) {
        return monthMap[lowerValue];
    }
    
    return parseInt(value);
}

function validateTemplate(value) {
    const templates = config.get('templates');
    if (!templates[value]) {
        return `Template must be one of: ${Object.keys(templates).join(', ')}`;
    }
    return true;
}

function validateWeekStart(value) {
    const dayMap = {
        'sunday': 0, 'sun': 0, '0': 0,
        'monday': 1, 'mon': 1, '1': 1,
        'tuesday': 2, 'tue': 2, '2': 2,
        'wednesday': 3, 'wed': 3, '3': 3,
        'thursday': 4, 'thu': 4, '4': 4,
        'friday': 5, 'fri': 5, '5': 5,
        'saturday': 6, 'sat': 6, '6': 6
    };
    
    const lowerValue = value.toString().toLowerCase();
    if (!dayMap.hasOwnProperty(lowerValue) && !dayMap.hasOwnProperty(value)) {
        return 'Week start must be a day name (sunday-saturday), abbreviation (sun-sat), or number (0-6)';
    }
    return true;
}

function parseWeekStart(value) {
    const dayMap = {
        'sunday': 0, 'sun': 0, '0': 0,
        'monday': 1, 'mon': 1, '1': 1,
        'tuesday': 2, 'tue': 2, '2': 2,
        'wednesday': 3, 'wed': 3, '3': 3,
        'thursday': 4, 'thu': 4, '4': 4,
        'friday': 5, 'fri': 5, '5': 5,
        'saturday': 6, 'sat': 6, '6': 6
    };
    
    const lowerValue = value.toString().toLowerCase();
    if (dayMap.hasOwnProperty(lowerValue)) {
        return parseInt(dayMap[lowerValue]);
    } else if (dayMap.hasOwnProperty(value)) {
        return parseInt(dayMap[value]);
    }
    return parseInt(value);
}

function validatePaperSize(value) {
    const paperSizes = config.get('paperSizes');
    if (!paperSizes[value]) {
        return `Paper size must be one of: ${Object.keys(paperSizes).join(', ')}`;
    }
    return true;
}

function validateNumberOfMonths(value) {
    const count = parseInt(value);
    if (isNaN(count) || count < 1 || count > 60) {
        return 'Number of months must be between 1 and 60';
    }
    return true;
}

function validatePaperMargin(value) {
    const margin = parseFloat(value);
    if (isNaN(margin) || margin < 0 || margin > 2) {
        return 'Paper margin must be a number between 0 and 2';
    }
    return true;
}

async function init() {
    program
        .name('calendar-svg')
        .description('Generate calendar SVG and PDF files')
        .option('--start-year <year>', 'year to start on (e.g., 2025)', (value) => {
            const year = parseInt(value);
            if (isNaN(year) || year < 1900 || year > 2100) {
                throw new Error('start-year must be a valid year between 1900 and 2100');
            }
            return year;
        })
        .option('--start-month <month>', 'month to start on (1-12, jan-dec, january-december)', (value) => {
            const result = parseMonth(value);
            const validation = validateMonth(value);
            if (validation !== true) {
                throw new Error(validation);
            }
            return result;
        })
        .option('--template <template>', 'calendar template (pocket, purse, mathias)', (value) => {
            const templates = config.get('templates');
            if (!templates[value]) {
                throw new Error(`template must be one of: ${Object.keys(templates).join(', ')}`);
            }
            return value;
        })
        .option('--week-start <day>', 'first day of week (sunday/sun/0, monday/mon/1, tuesday/tue/2, wednesday/wed/3, thursday/thu/4, friday/fri/5, saturday/sat/6)', (value) => {
            const validation = validateWeekStart(value);
            if (validation !== true) {
                throw new Error(validation);
            }
            return parseWeekStart(value);
        })
        .option('--paper-size <size>', 'paper size (roll, strip, letter, maxroll)', (value) => {
            const paperSizes = config.get('paperSizes');
            if (!paperSizes[value]) {
                throw new Error(`paper-size must be one of: ${Object.keys(paperSizes).join(', ')}`);
            }
            return value;
        })
        .option('--number-of-months <count>', 'number of months to generate', (value) => {
            const count = parseInt(value);
            if (isNaN(count) || count < 1 || count > 60) {
                throw new Error('number-of-months must be between 1 and 60');
            }
            return count;
        })
        .option('--paper-margin <margin>', 'paper margin in inches', (value) => {
            const margin = parseFloat(value);
            if (isNaN(margin) || margin < 0 || margin > 2) {
                throw new Error('paper-margin must be a number between 0 and 2');
            }
            return margin;
        })
        .option('--comment <comment>', 'add comment to filename in parentheses');

    program.parse();
    let options = program.opts();

    // Create prompts for missing options
    const prompts = [];
    
    if (!options.startYear) {
        const defaultYear = getDefaultYear();
        prompts.push({
            type: 'input',
            name: 'startYear',
            message: 'Year to start on:',
            default: defaultYear,
            validate: validateYear,
            filter: (input) => parseInt(input)
        });
    }
    
    if (!options.startMonth) {
        prompts.push({
            type: 'input',
            name: 'startMonth',
            message: 'Month to start on (1-12 or month name):',
            default: 'january',
            validate: validateMonth,
            filter: parseMonth
        });
    }
    
    if (!options.template) {
        const templates = config.get('templates');
        prompts.push({
            type: 'list',
            name: 'template',
            message: 'Calendar template:',
            choices: Object.keys(templates),
            default: 'pocket'
        });
    }
    
    if (!options.weekStart) {
        prompts.push({
            type: 'list',
            name: 'weekStart',
            message: 'First day of week:',
            choices: [
                { name: 'Sunday', value: 0 },
                { name: 'Monday', value: 1 },
                { name: 'Tuesday', value: 2 },
                { name: 'Wednesday', value: 3 },
                { name: 'Thursday', value: 4 },
                { name: 'Friday', value: 5 },
                { name: 'Saturday', value: 6 }
            ],
            default: 0
        });
    }
    
    // For paper size, we need to know the template first
    if (!options.paperSize) {
        // If template was provided via CLI or already prompted, use it for default
        const selectedTemplate = options.template || (prompts.find(p => p.name === 'template') ? undefined : 'pocket');
        
        if (selectedTemplate) {
            const defaultPaperSize = getDefaultPaperSize(selectedTemplate);
            const paperSizes = config.get('paperSizes');
            prompts.push({
                type: 'list',
                name: 'paperSize',
                message: 'Paper size:',
                choices: Object.keys(paperSizes),
                default: defaultPaperSize
            });
        } else {
            // Template will be asked first, so we'll handle paper size after
            prompts.push({
                type: 'list',
                name: 'paperSize',
                message: 'Paper size:',
                choices: (answers) => {
                    const paperSizes = config.get('paperSizes');
                    return Object.keys(paperSizes);
                },
                default: (answers) => {
                    const template = answers.template || options.template || 'pocket';
                    return getDefaultPaperSize(template);
                }
            });
        }
    }
    
    if (!options.numberOfMonths) {
        prompts.push({
            type: 'input',
            name: 'numberOfMonths',
            message: 'Number of months to generate:',
            default: '12',
            validate: validateNumberOfMonths,
            filter: (input) => parseInt(input)
        });
    }
    
    if (!options.paperMargin) {
        prompts.push({
            type: 'input',
            name: 'paperMargin',
            message: 'Paper margin in inches:',
            default: '0.5',
            validate: validatePaperMargin,
            filter: (input) => parseFloat(input)
        });
    }
    
    if (!options.comment) {
        prompts.push({
            type: 'input',
            name: 'comment',
            message: 'Comment for filename (optional, press Enter to skip):',
            default: ''
        });
    }
    
    // Ask for missing options
    if (prompts.length > 0) {
        const answers = await inquirer.prompt(prompts);
        // Merge answers with existing options
        options = { ...options, ...answers };
    }
    
    // Set defaults for options that have them and weren't provided
    if (!options.numberOfMonths) {
        options.numberOfMonths = 12;
    }
    if (!options.paperMargin) {
        options.paperMargin = 0.5;
    }

    const settings = new Settings({
        startYear: options.startYear,
        startMonth: options.startMonth,
        numberOfMonths: options.numberOfMonths,
        template: options.template,
        weekStart: options.weekStart,
        paperSize: options.paperSize,
        margin: options.paperMargin
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log("\n=== Calendar Generation Settings ===");
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
    const commentPart = options.comment ? `(${options.comment})` : '';
    const filename = './output/calendar-'+settings.template.name+'-'+settings.start.year+'-'+settings.start.month+'-'+dayNamesLower[settings.week_starts_on]+'-'+settings.paper.sizes.width+'x'+settings.paper.sizes.height+'('+Math.round(settings.paper.sizes.width*25.4*100)/100+'x'+Math.round(settings.paper.sizes.height*25.4*100)/100+')-'+settings.number_of_months+'months'+commentPart+'.pdf'
    const myPDFfile = new OutputPDF(myCalendar, filename)
    
    console.log("\n✅ Calendar generated successfully!");
    console.log("📄 Output file:", filename);
}

init().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});