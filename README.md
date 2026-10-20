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
| `planner-across` | horizontal / day | like `planner`, but the pages sit side by side along a landscape strip, with day columns running edge to edge across the folds |
| `planner-yearly` | horizontal / day | the year on one strip: striped bands, no weekend shading, darker week dividers, month names clear of the lines, and "Week N" in the footer |
| `planner-project` | horizontal / day | fixed pages of 14 days (two weeks) side by side, with year and quarter labels along the top; each column's footer reads weekday, day number and, on the 1st, the month name |

Use a portrait template with the planner presets: `pocket-portrait`, `purse-portrait` or `mathias-portrait`.

#### Yearly planner

`planner-yearly` lays the pages out left to right, so the paper is turned sideways: a `roll` is 8.75 in tall and as long as the calendar needs. Each month takes two pages (15 + 16 days), the day columns run flush across the folds, and the footer carries the day number (in a lighter gray) with "Week N" above it at the start of each week.

A full year, Monday weeks, on a roll:

```
node index.js --start-year 2027 --start-month 1 --template pocket-portrait --week-start 1 --paper-size roll \
  --number-of-months 12 --preset planner-yearly --comment yearly
```

That makes 24 pages on an 82.25 × 8.75 in strip. The `pocket-portrait` panels are 3.375 × 5.5 in; `purse-portrait` fits an 8.75 in roll exactly. The `strip` paper size is also turned sideways (42 × 7 in), so it holds fewer pages. Day columns are narrow, so type sizes are small; adjust them with `--set fontSizes.weekNumber=6` and similar.

Tweaks that work well with `--set`:

```
--set weekend.shade=true --set bands.stripes=false   # shaded weekends instead of striped bands
--set labels.weekNumberBottom=false                 # no "Week N" in the footer
--set labels.digitsBottomColor=darkgray             # darker footer day numbers
--set flush=false                                   # keep the side padding (padding.x) at the folds
```

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

- `pagination.mode`: `monthly` (with `pagesPerMonth`) or `fixed` (with `daysPerPage`). In monthly mode, pages of one month share a column width, so a 15-day page leaves one slot empty above a 16-day page; in fixed mode all columns are the same. With `arrange: across` each page fills its own width instead.
- `arrange`: `across` puts the pages side by side (the paper turns sideways); the default stacks them down the roll.
- `flush`: no side padding, so day columns run edge to edge. A column line is drawn at every fold.
- `clearMonthHeader`: column lines start under the year, quarter and month labels instead of running through them.
- `weekend.shade`: shade Saturday and Sunday. Not combined with striped bands (weekends stay unshaded if you ask for both).
- `weekDivider` / `columnLines`: darker line where a new week starts (set by `--week-start`) and light lines between the other days.
- `bands`: `count` horizontal bands in the body, with `stripes` (alternate bands shaded), `hairlines`, and `hours` labels (`none`, `left`, `right`, `both`; `first` hour and `perBand` hours).
- `labels`: `month` (`auto` is above the 1st for monthly pagination and vertical in the 1st's column for fixed; or `top`, `vertical`, `none`), `weekday` (`short` is three letters, or `letter`, `none`), `weekdayTop`, `weekdayBottom`, `weekNumbers`, `year` and `quarter` (labels along the top, at the start of each year or quarter and on the first column), `weekNumberBottom` ("Week N" in the footer), `digitsTop`, `digitsBottom`, `digitsBottomColor`. Bottom text reads bottom to top: weekday, day number, then the month on the 1st (when `month` is `vertical`), with the week label one row further up.
- `fontSizes`: optional absolute sizes in points (`days`, `weekday`, `weekNumber`, `month`, `monthVertical`, `year`, `quarter`, `hours`). Nothing is resized automatically, so narrow columns need smaller sizes.
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