# Accordion Calendar Generator

This is the code used to generate Accordion Calendars (see [accordioncalendar.com](http://www.accordioncalendar.com)) 

A calendar can is first generated in SVG, then a PDF output file is created. 

![Accordion Calendar Screenshot](https://github.com/brovalex/accordion-calendar-generator/blob/main/assets/calendar-screenshot.png?raw=true)

## Features

- Generates print-ready mechanicals, including bleed, crop marks, fold marks, and outlined fonts
- Highly configurable: width, height, start date, and number of months.
- Calculates the appropriate page breaks for the first row of every page to start on the 1st of the month. 
- Adjusts layout depending on week start day. 
- Preconfigured templates for layouts and physical paper sizes. 
- Adjusts output to based on physical paper size available
- Automatically adjusts the height of rows to the number of weeks per month. 

## Usage

Run following command will create a `calendar.pdf` print-ready file in the current folder. (Run `npm install` first obvi.)

```
node index.js <start_year> <start_month> <number_of_months> <template> <week_starts_on> <paper_size>
```

### Parameters:

- `<start_year>`: The starting year of the calendar (e.g., 2023).
- `<start_month>`: The starting month of the calendar (1 for January, 12 for December, etc.). Note that the calendar will calculate the correct first day for the calendar given the `<week_starts_on>` parameter. 
- `<number_of_months>`: The number of months to generate (e.g., 12 for a full year).
- `<template>`: The design template for the calendar, currently offered in two sizes on the website (`pocket` and `purse`). These are specified in [`default.json`](./config/default.json). 
- `<week_starts_on>`: The day the week starts on (0 for Sunday, 1 for Monday, etc.).
- `<paper_size>`: The paper size for the output. Options I use are (`roll`, `strip`, and `letter`). These are specified in [`default.json`](./config/default.json). 

### Example command

To generate a pocket calendar starting from January 2023 for 12 months, with weeks starting on Monday (1), in a strip layout:

```
node index.js 2023 1 12 pocket 1 strip
```

### Custom configuration settings

You can override config settings with a `local.json` file in the [`config`](./config/) folder. 

### Server mode

When I'm working on visual tweaks, it's convenient to have the SVG generated in the browser, and to watch for file changes automatically. You can run a server on localhost with the following command (assuming `npx` is installed, obvi): 

```
npx nodemon server.js
```

## Todo/fix:

- [ ] implement better args management
- [ ] provide better export as a library
- [ ] provide easy option to remove cropmarks and export SVG file instead

## Future work / ideas:

- provide version with fixed week height for non-printed / non-accordion version
- Support as an API/service to return SVG or PDF
- Multilingual support
- Split calendar multiple physical pages when necessary (e.g. print on multiple A4) - this was implemented in the original script, but removed in the refactor because I no longer needed it

## Notes:

- Had to hack colour names in the CMYK colour conversion package, because an issue in the package itself doesn't allow for passing custom colours properly

## Credits

- Code by [Alex Brovkin](https://github.com/brovalex)
- A big thank you to the many people who provided feedback on the code, and the printed calendars

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You may use, distribute, and modify this software under the terms of the AGPL. This ensures that any modifications or derivative works that you distribute, even if accessed over a network, are also released under the AGPL. For full details, see the [LICENSE](./LICENSE) file.