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

### Layout presets

A layout is a *flow* (which way the pages fill up), a *grain* (the unit along that flow) and what the other axis holds. A **preset** bundles every setting for one layout, and presets can `extend` each other. Pick one with `--preset`; the default is `classic`.

| preset | flow / grain | what it is |
| --- | --- | --- |
| `classic` | vertical / week | the original: one month per page, a row per week |
| `planner` | horizontal / day | one thin portrait column per day; each month is split over 2 pages (15 + 16 days) |
| `planner-fixed` | horizontal / day | same, but every page holds 14 days, starting with the week that contains the 1st of the start month |
| `planner-month` | horizontal / day | a whole month on one page, with smaller type to fit 31 columns |
| `planner-hours` | horizontal / day | fixed pages with 12 striped hour bands and hour labels instead of shaded weekends |

Use a portrait template with the planner presets: `pocket-portrait`, `purse-portrait` or `mathias-portrait`.

```
node index.js --start-year 2027 --start-month 1 --template purse-portrait --week-start 1 --paper-size roll \
  --number-of-months 12 --preset planner-fixed --pages 14 --comment demo
```

`--pages` sets the page count outright, for example 12 pages instead of the whole year, or 14 to run a few weeks over. Keep it even if the first and last pages need to fold shut like a cover. Without it, fixed pagination rounds up to whole pages and the extra days simply continue into the next month.

Any value can be overridden on the fly with `--set`, and you can make your own presets in `config/local.json`:

```
--set bands.stripes=true --set labels.weekNumbers=true --set labels.weekday=letter
```

```json
{ "presets": { "my-planner": { "extends": "planner-fixed", "bands": { "hairlines": true }, "labels": { "weekdayBottom": true } } } }
```

Planner settings (see `planner` in [`default.json`](./config/default.json) for the defaults):

- `pagination.mode`: `monthly` (with `pagesPerMonth`) or `fixed` (with `daysPerPage`). In monthly mode each page stretches its columns to fill the width; in fixed mode all columns are the same.
- `weekend.shade`: shade Saturday and Sunday. Not combined with striped bands (weekends stay unshaded if you ask for both).
- `weekDivider` / `columnLines`: darker line where a new week starts (set by `--week-start`) and light lines between the other days.
- `bands`: `count` horizontal bands in the body, with `stripes` (alternate bands shaded), `hairlines`, and `hours` labels (`none`, `left`, `right`, `both`; `first` hour and `perBand` hours).
- `labels`: `month` (`auto` is above the 1st for monthly pagination and vertical in the 1st's column for fixed; or `top`, `vertical`, `none`), `weekday` (`short` is three letters, or `letter`, `none`), `weekdayBottom`, `weekNumbers`, `digitsTop`, `digitsBottom`. Bottom text reads bottom to top.
- `fontSizes`: optional absolute sizes in points (`days`, `weekday`, `weekNumber`, `month`, `monthVertical`, `hours`). Nothing is resized automatically, so narrow columns need smaller sizes.
- `padding`: `x`, `top`, `bottom` in inches.

Only the `classic` (vertical/week) and planner (horizontal/day) combinations are drawn so far; other combinations of `flow` and `grain` are rejected with an error.

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