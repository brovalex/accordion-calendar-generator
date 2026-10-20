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

### Templates

There are four calendar templates. A template is a **preset**: it bundles every layout setting, and presets can `extend` each other. Pick one with `--preset`; the default is `classic`.

| preset | what it is |
| --- | --- |
| `classic` | the original: one month per page, a row per week, pages stacked down the roll |
| `planner-yearly` | the year on one sideways strip: a thin column per day, two pages per month, striped bands, darker week dividers |
| `planner-project` | a project planner on a sideways strip: two-week pages from week 1, fiscal quarters, 6-week cycles with a cool-down |
| `planner-weekly` | a weekly planner: one wide page per week, side by side on the sideways strip, with an hourly row grid |

The planners lay their pages out left to right, so the paper is turned sideways: a `roll` is 8.75 in tall and as long as the calendar needs, and the day columns run edge to edge across the folds. Use a portrait template with the yearly and project planners: `pocket-portrait`, `purse-portrait` or `mathias-portrait` (`pocket-portrait` panels are 3.375 × 5.5 in; `purse-portrait` fits an 8.75 in roll exactly). The `strip` paper size is also turned sideways (42 × 7 in), so it holds fewer pages. Day columns are narrow, so type is small; adjust it with `--set fontSizes.weekNumber=6` and similar.

#### Yearly planner

`planner-yearly` gives each month two pages (15 + 16 days), with the day columns flush across the folds. Weekends are not shaded; a darker line marks each week start and light horizontal stripes run across the body. The month name sits above the 1st and the column lines start below it. The footer carries the day number (in a lighter gray) with a small "Week N" above it at the start of each week.

A full year, Monday weeks, on a roll:

```
node index.js --start-year 2027 --start-month 1 --template pocket-portrait --week-start 1 --paper-size roll \
  --number-of-months 12 --preset planner-yearly --comment yearly
```

That makes 24 pages on an 82.25 × 8.75 in strip. Tweaks that work well with `--set`:

```
--set weekend.shade=true --set bands.stripes=false   # shaded weekends instead of striped bands
--set labels.weekNumberBottom=false                 # no "Week N" in the footer
--set labels.digitsBottomColor=darkgray             # darker footer day numbers
--set flush=false                                   # keep the side padding (padding.x) at the folds
```

#### Project planner

`planner-project` is built for planning in two-week pages that follow the fiscal calendar:

- **Pages:** fixed 14-day pages side by side. With Monday weeks and a January start it opens on the first day of ISO week 1, which can skip the first days of January (Monday 4 January 2027), so the strip starts exactly at week 1.
- **Quarters:** a big quarter label with the year small beside it ("Q1 2027") at the first column and wherever a quarter starts. Quarters are 13-week blocks starting at weeks 1, 14, 27 and 40, and the year turns over at week 1. Use `--set labels.quarter=months` for calendar quarters instead.
- **Cycles:** under the quarter, a line runs from the start to the end of each 6-week cycle (with end bars and a "Cycle N" label), followed by a lighter 2-week "Cool-down" line, repeating from the first week 1 on the strip. They do not realign at year end, so they will not line up with quarters. Change the lengths with `--set labels.cycles.weeks=4 --set labels.cycles.cooldown=1`, or turn the row off with `--set labels.cycles=false`.
- **Days:** the weekday and day number run along the top, weekends are shaded and a darker line marks each week start. The column lines and shading start below the header block.
- **Footer:** reading bottom to top, weekday, day number and, on the 1st, the month name.
- **Month watermark:** a large, pale month name runs left to right across the days, just under the day numbers, starting at the column of the 1st (and at the first column, so the opening month is named even when it starts after the 1st). Size it with `--set fontSizes.monthWatermark=24`, or turn it off with `--set labels.monthWatermark=false`.

Four months, Monday weeks, on a roll (`--pages 10` keeps the page count even so the ends can fold shut like a cover):

```
node index.js --start-year 2027 --start-month 1 --template pocket-portrait --week-start 1 --paper-size roll \
  --number-of-months 4 --pages 10 --preset planner-project --comment project
```

A full year is `--number-of-months 12`: 26 pages on an 89 × 8.75 in strip.

#### Weekly planner

`planner-weekly` is one week per page, like the yearly planner but with wider pages and hours on the rows. The pages sit side by side on the sideways strip, so the day columns run edge to edge across the whole calendar with a darker line at each week start. Use a landscape template for the wider page (`pocket` or `purse`; the page size changes, not the strip's orientation).

- **Pages:** one week (7 days) per page, starting at ISO week 1 (Monday 4 January 2027) so the pages match the week numbers.
- **Header:** one small row: the day number at the left of each column with the weekday right after it.
- **Month:** the pale month watermark runs across the top of the main area, only on the 1st of each month (and on the very first column of the strip, so the opening month is named). When the 1st is the first column of a page, the name starts just after the hour labels so they do not overlap.
- **Rows:** 16 hourly rows from 06 to 21, alternately shaded, with the hour (zero-padded, light gray; `bands.hours.color` changes it) at the left of the first column of every page. Weekends are not shaded.
- **Week number:** "Week N" at the bottom left of each page, under the rows.

```
node index.js --start-year 2027 --start-month 1 --template purse --week-start 1 --paper-size roll \
  --number-of-months 12 --preset planner-weekly --comment weekly
```

That makes about 52 pages of 7.5 in each, so a long strip (`purse` pages fit the 8.75 in roll). Change the hours with `--set bands.count=12 --set bands.hours.first=8`, or give every row two hours with `--set bands.hours.perBand=2`. Add `--set bands.hairlines=true` for a line between rows. `bands.hours.labels=inside` puts the hours in the first column; the other values (`left`, `right`, `both`) use the side padding, which needs `--set flush=false`.

#### Other presets

`planner`, `planner-across`, `planner-fixed`, `planner-month` and `planner-hours` are the building blocks the two planners are made from, and they stay available for experiments or as a base for your own preset: `planner` is a thin column per day with each month split over two stacked pages, `planner-across` lays those pages side by side, `planner-fixed` uses 14-day pages starting with the week that contains the 1st, `planner-month` fits a whole month on one page, and `planner-hours` adds 12 striped hour bands with hour labels. Only the `classic` (vertical/week) and planner (horizontal/day) combinations of `flow` and `grain` are drawn; other combinations are rejected with an error.

`--pages` sets the page count outright, for example 12 pages instead of the whole year, or 14 to run a few weeks over. Keep it even if the first and last pages need to fold shut like a cover. Without it, fixed pagination rounds up to whole pages and the extra days simply continue into the next month.

Any value can be overridden on the fly with `--set`, and you can make your own presets in `config/local.json`:

```
--set bands.stripes=true --set labels.weekNumbers=true --set labels.weekday=letter
```

```json
{ "presets": { "my-planner": { "extends": "planner-fixed", "bands": { "hairlines": true }, "labels": { "weekdayBottom": true } } } }
```

Planner settings (see `planner` in [`default.json`](./config/default.json) for the defaults):

- `pagination.mode`: `monthly` (with `pagesPerMonth`) or `fixed` (with `daysPerPage`). Fixed pagination can also set `startAt: "week1"` to open on the first day of ISO week 1 (Monday weeks, starting in January), which may skip the first days of January (4 Jan 2027); `planner-project` does this. In monthly mode, pages of one month share a column width, so a 15-day page leaves one slot empty above a 16-day page; in fixed mode all columns are the same. With `arrange: across` each page fills its own width instead.
- `arrange`: `across` puts the pages side by side (the paper turns sideways); the default stacks them down the roll.
- `flush`: no side padding, so day columns run edge to edge. A column line is drawn at every fold.
- `clearMonthHeader`: column lines and weekend shading start under the header labels (year, quarter, cycles, month) instead of running behind them.
- `weekend.shade`: shade Saturday and Sunday. Not combined with striped bands (weekends stay unshaded if you ask for both).
- `weekDivider` / `columnLines`: darker line where a new week starts (set by `--week-start`) and light lines between the other days.
- `bands`: `count` horizontal bands in the body, with `stripes` (alternate bands shaded), `hairlines`, and `hours` labels (`none`, `left`, `right`, `both`, or `inside` for the first column of each page, with `pad` for a leading zero; `first` hour and `perBand` hours).
- `labels`: `month` (`auto` is above the 1st for monthly pagination and vertical in the 1st's column for fixed; or `top`, `vertical`, `none`), `weekday` (`short` is three letters, or `letter`, `none`), `weekdayTop`, `weekdayBottom`, `weekNumbers`, `year` and `quarter` (labels along the top, on the first column and where a year or quarter starts; the year follows the quarter on the same line, e.g. "Q1 2027", and only gets a row of its own when there is no quarter label; `quarter` is `weeks` for 13-week fiscal quarters starting at weeks 1, 14, 27 and 40, with the year turning over at week 1, or `months` for calendar quarters starting on the 1st of Jan, Apr, Jul and Oct), `cycles` (optional, off unless set; used by `planner-project`: `{ "weeks": 6, "cooldown": 2 }` draws a line from the start to the end of each 6-week cycle, then a lighter 2-week "Cool-down" line, repeating from the first week 1 on the strip), `monthWatermark` (a big, pale month name running left to right across the days, starting at the column of the 1st and of the first column, just under the header; size via `fontSizes.monthWatermark`, or relative to the template's month size with `monthWatermarkScale`; `monthWatermarkOffset` moves it down from the top of the body, in points), `weekNumberBottom` ("Week N" in the footer), `weekNumberBottomLeft` ("Week N" at the bottom left of each page, under the body), `weekNumberPrefix` (text before the week number, e.g. `Week `), `dayHeader` (`inline` puts the day number and the weekday after it on one top row), `monthEveryPage` (name the month at the start of a page that opens mid-month), `digitsTop`, `digitsBottom`, `digitsBottomColor`. Bottom text reads bottom to top: weekday, day number, then the month on the 1st (when `month` is `vertical`), with the week label one row further up.
- `fontSizes`: optional absolute sizes in points (`days`, `weekday`, `weekNumber`, `month`, `monthVertical`, `monthWatermark`, `year`, `quarter`, `cycle`, `hours`). Nothing is resized automatically, so narrow columns need smaller sizes.
- `padding`: `x`, `top`, `bottom` in inches.

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