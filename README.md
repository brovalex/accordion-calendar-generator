# Accordion Calendar Generator

This is the code used to generate Accordion Calendars (see [accordioncalendar.com](http://www.accordioncalendar.com)) 

A calendar is first generated in SVG, then a PDF output file is created. 

![Accordion Calendar Screenshot](https://github.com/brovalex/accordion-calendar-generator/blob/main/assets/calendar-screenshot.png?raw=true)

## Features

- Generates print-ready mechanicals, including bleed, crop marks, fold marks, and outlined fonts
- Four templates: the original month-per-page calendar, a yearly planner, a project planner with fiscal quarters and cycles, and a weekly planner with hourly rows and moon phases
- Highly configurable: templates, paper size, start date, number of months, week start day, and any layout setting via `--set`
- Calculates the appropriate page breaks (for the original calendar, the first row of every page starts on the 1st of the month; the planners can open on ISO week 1)
- Adjusts layout depending on week start day
- Preconfigured templates for layouts and physical paper sizes
- Adjusts output based on the physical paper size available
- Automatically adjusts the height of rows to the number of weeks per month (original calendar)

## Usage

Run `npm install` first, then:

```
node index.js [options]
```

Any option you leave out is asked for interactively (`--set` and `--pages` excepted), so a script needs all of the others, even `--comment`; press Enter at the comment prompt to skip it. The PDF is written to the `output` folder, named after the template, start date, paper size and page count, with your `--comment` in brackets at the end.

### Options

- `--start-year <year>`: the year to start on (e.g. 2027).
- `--start-month <month>`: the month to start on, `1`-`12` or a name (`jan`, `january`, ...). The calendar works out the correct first day given `--week-start`.
- `--number-of-months <count>`: the number of months to generate (1-60, e.g. 12 for a full year).
- `--template <name>`: the page size and type sizes: `pocket`, `purse` or `mathias` (landscape), or `pocket-portrait`, `purse-portrait` or `mathias-portrait` (portrait). `pocket` and `purse` are the two sizes offered on the website. They are specified in [`default.json`](./config/default.json).
- `--preset <name>`: the layout: `classic` (preselected in the prompt), `planner-yearly`, `planner-project` or `planner-weekly`. See [Templates](#templates).
- `--week-start <day>`: the day the week starts on (`sunday`/`sun`/`0`, `monday`/`mon`/`1`, and so on).
- `--paper-size <size>`: the paper for the output: `roll`, `strip`, `letter` or `maxroll`. These are specified in [`default.json`](./config/default.json).
- `--paper-margin <inches>`: the margin around the artwork, 0 to 2. Without it you are asked, so pass it in scripts (the examples use `0.5`).
- `--pages <count>`: the number of pages, for presets that choose their own (the planners).
- `--set <key=value>`: override one preset value, e.g. `--set bands.stripes=true`. Repeatable. See [Overriding settings](#overriding-settings).
- `--comment <text>`: added to the file name in brackets.

### Example command

To generate a pocket calendar starting from January 2027 for 12 months, with weeks starting on Monday, on a strip:

```
node index.js --start-year 2027 --start-month 1 --template pocket --week-start 1 --paper-size strip \
  --number-of-months 12 --paper-margin 0.5 --preset classic --comment example
```

### Templates

There are four calendar templates. A template is a **preset**: it bundles every layout setting, and presets can `extend` each other. Pick one with `--preset`.

| preset | what it is |
| --- | --- |
| `classic` | the original: one month per page, a row per week, pages stacked down the roll |
| `planner-yearly` | the year on one sideways strip: a thin column per day, two pages per month, striped bands, magenta week lines |
| `planner-project` | a project planner on a sideways strip: two-week pages from week 1, fiscal quarters with two 6-week cycles and a buffer week each (optional), magenta week lines and quarter labels |
| `planner-weekly` | a weekly planner: one wide page per week, side by side on the sideways strip, with an hourly row grid and a magenta week line |

As in the original, the magenta is on the lines that run parallel to the fold edge, here the week lines (the yearly, project and weekly planners), plus the quarter labels in the project planner. The planners lay their pages out left to right, so the paper is turned sideways: a `roll` is 8.75 in tall and as long as the calendar needs, and the day columns run edge to edge across the folds. Use a portrait template with the yearly and project planners: `pocket-portrait`, `purse-portrait` or `mathias-portrait` (`pocket-portrait` panels are 3.375 × 5.5 in; `purse-portrait` fits an 8.75 in roll exactly). The weekly planner uses a landscape template instead. The `strip` paper size is also turned sideways (42 × 7 in), so it holds fewer pages. Day columns are narrow, so type is small; adjust it with `--set fontSizes.weekNumber=6` and similar.

#### Classic

`classic` is the original layout: one month per page, a row per week, seven day columns, with the pages stacked down the roll or strip. Rows resize to the number of weeks in the month, a magenta line closes each week, weekends are shaded, and the week number sits at the left of each row. Use a landscape template (`pocket`, `purse` or `mathias`); it has no planner options, only the template, paper and start settings.

```
node index.js --start-year 2027 --start-month 1 --template pocket --week-start 1 --paper-size strip \
  --number-of-months 12 --paper-margin 0.5 --preset classic --comment classic
```

#### Yearly planner

`planner-yearly` gives each month two pages (15 + 16 days), with the day columns flush across the folds. Weekends are not shaded; the week lines are magenta and the day lines gray, and light horizontal stripes run across the body. The month name sits above the 1st and the column lines start below it. The footer carries the day number (in a lighter gray) with a small "Week N" above it at the start of each week.

A full year, Monday weeks, on a roll:

```
node index.js --start-year 2027 --start-month 1 --template pocket-portrait --week-start 1 --paper-size roll \
  --number-of-months 12 --paper-margin 0.5 --preset planner-yearly --comment yearly
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
- **Quarters:** a big magenta quarter label with the year small and gray beside it ("Q1 2027") at the first column and wherever a quarter starts. Quarters are 13-week blocks starting at weeks 1, 14, 27 and 40, and the year turns over at week 1. Use `--set labels.quarter=months` for calendar quarters instead.
- **Cycles (optional):** under the quarter, a line runs from the start to the end of each cycle (with end bars and a "Cycle N" label). A 13-week quarter holds Cycle 1 (6 weeks), Cycle 2 (6 weeks) and a 1-week "Buffer" in a lighter line, so the year adds up to 52 weeks; in a 53-week year the extra week joins the last quarter's buffer. The cycles follow the fiscal quarters (counted from week 1), and a strip that opens mid-quarter names the cycle it opens in. Turn the whole row off with `--set labels.cycles=false` (the header gets shorter), or change the length with `--set labels.cycles.weeks=5`.
- **Days:** the weekday and day number run along the top, weekends are shaded, the week lines are magenta and the day lines gray. The column lines and shading start below the header block.
- **Footer:** reading bottom to top, weekday, day number and, on the 1st, the month name.
- **Month watermark:** a large, pale month name runs left to right across the days, just under the day numbers, starting at the column of the 1st (and at the first column, so the opening month is named even when it starts after the 1st). Size it with `--set fontSizes.monthWatermark=24`, or turn it off with `--set labels.monthWatermark=false`.

Four months, Monday weeks, on a roll (`--pages 10` keeps the page count even so the ends can fold shut like a cover):

```
node index.js --start-year 2027 --start-month 1 --template pocket-portrait --week-start 1 --paper-size roll \
  --number-of-months 4 --pages 10 --paper-margin 0.5 --preset planner-project --comment project
```

A full year is `--number-of-months 12`: 26 pages on an 89 × 8.75 in strip.

#### Weekly planner

`planner-weekly` is one week per page, like the yearly planner but with wider pages and hours on the rows. The pages sit side by side on the sideways strip, so the day columns run edge to edge across the whole calendar, with a magenta line at each week start (the day lines inside a week stay gray). Use a landscape template for the wider page (`pocket` or `purse`; the page size changes, not the strip's orientation).

- **Pages:** one week (7 days) per page, starting at ISO week 1 (Monday 4 January 2027) so the pages match the week numbers.
- **Header:** one small row: the day number at the left of each column with the weekday right after it.
- **Month:** the pale month watermark runs across the top of the main area, only on the 1st of each month (and on the very first column of the strip, so the opening month is named). Its baseline sits on a row line, the line between two hours. When the 1st is the first column of a page, the name starts just after the hour labels so they do not overlap.
- **Rows:** 16 hourly rows from 06 to 21, alternately shaded (the 06 row is shaded, the reverse of the yearly planner), with the hour (zero-padded, light gray; `bands.hours.color` changes it) at the left of the first column of every page. Weekend columns are shaded under the stripes (`weekend.overStripes`), so both show: the stripes are a step darker where they cross a weekend. Turn the weekend shading off with `--set weekend.shade=false`.
- **Week number:** "Week N" at the bottom left of each page, under the rows.
- **Moon phases:** a small icon at the right of the day-number row on the days of the four principal phases: a ring for the new moon, a disc half lit on the right for the first quarter, a full disc for the full moon and a disc half lit on the left for the last quarter (northern hemisphere view; `--set labels.moon.southern=true` mirrors the quarters). Turn them off with `--set labels.moon=false`.

The phases come from Meeus' algorithm (the `astronomia` package) and were checked against an independent ephemeris for every phase from November 2026 to March 2028, to within about 13 seconds. The calendar day a phase falls on depends on the time zone, since a phase is an instant: the day is taken in UTC unless you give your whole-hour offset, for example `--set labels.moon.utcOffset=-5` for New York in winter or `--set labels.moon.utcOffset=1` for Paris. Phases near midnight can land on a different day for a different offset, and the offset does not follow daylight saving changes within the year.

```
node index.js --start-year 2027 --start-month 1 --template purse --week-start 1 --paper-size roll \
  --number-of-months 12 --paper-margin 0.5 --preset planner-weekly --comment weekly
```

That makes 52 pages of 7.5 in each: a strip 391 in long (`purse` pages fit the 8.75 in roll). That is longer than the 200 in some PDF software and printers accept, so for printing make it in sections, for example `--number-of-months 6` or `--pages 26`. Change the hours with `--set bands.count=12 --set bands.hours.first=8`, or give every row two hours with `--set bands.hours.perBand=2`. Add `--set bands.hairlines=true` for a line between rows. `bands.hours.labels=inside` puts the hours in the first column; the other values (`left`, `right`, `both`) use the side padding, which needs `--set flush=false`.

#### Tinkering with type and baselines

Nothing resizes automatically, so the planners are tuned by eye. A few things worth knowing:

- **Sizes** are in points. Each size defaults to the template's `fonts` entry in [`default.json`](./config/default.json) (`Days`, `DaysOfWeek`, `WeekNumber`, `MonthHeader`, `MonthVertical`, `Hours`), and a preset's `fontSizes` overrides it, for example `--set fontSizes.days=10 --set fontSizes.weekday=5`. Columns are only about 17 pt wide in the yearly and project planners, so change one size by a point at a time.
- **The month watermark** is sized relative to the template's month size with `labels.monthWatermarkScale` (or absolutely with `fontSizes.monthWatermark`). Where there are hour rows its baseline snaps down onto the nearest row line, starting from `labels.monthWatermarkOffset` points below the top of the rows, so it moves in whole-row steps. Raise or lower the offset to land on a different line; row height depends on the template and on `bands.count`.
- **Baselines:** planner text is placed by baseline, so the day number and weekday, or the quarter and year, line up even at different sizes. The year is centred on the quarter's cap height instead. Hour labels sit a little under the top of their row.
- **Classic** has no such options; its month header is nudged with `yShift` in the template's `fonts` (`MonthHeader`) and `fonts.monthFont` in [`default.json`](./config/default.json).
- **Checking a change:** render a few weeks or months with `--pages` or a small `--number-of-months`, then zoom the PDF (for example `pdftoppm -r 288 -x 0 -y 100 -W 900 -H 500 file.pdf out`) to compare baselines against the row lines.

#### Other presets

`planner`, `planner-across`, `planner-fixed`, `planner-month` and `planner-hours` are the building blocks the planners are made from, and they stay available for experiments or as a base for your own preset: `planner` is a thin column per day with each month split over two stacked pages, `planner-across` lays those pages side by side, `planner-fixed` uses 14-day pages starting with the week that contains the 1st, `planner-month` fits a whole month on one page, and `planner-hours` adds 12 striped hour bands with hour labels. Only the `classic` (vertical/week) and planner (horizontal/day) combinations of `flow` and `grain` are drawn; other combinations are rejected with an error.

### Overriding settings

Any preset value can be overridden on the fly with `--set`, using a dotted path:

```
--set bands.stripes=true --set labels.weekNumbers=true --set labels.weekday=letter
```

`--pages` sets the page count outright, for example 12 pages instead of the whole year, or 14 to run a few weeks over. Keep it even if the first and last pages need to fold shut like a cover. Without it, fixed pagination rounds up to whole pages and the extra days simply continue into the next month.

To keep your own settings, make a preset in `config/local.json` (a `local.json` in the [`config`](./config/) folder overrides [`default.json`](./config/default.json)). It only needs to list what it changes:

```json
{ "presets": { "my-planner": { "extends": "planner-fixed", "bands": { "hairlines": true }, "labels": { "weekdayBottom": true } } } }
```

### Planner settings

See the presets in [`default.json`](./config/default.json) for the defaults.

- `pagination`: `mode` is `monthly` (with `pagesPerMonth`) or `fixed` (with `daysPerPage`). Fixed pagination can also set `startAt: "week1"` to open on the first day of ISO week 1 (Monday weeks, starting in January), which may skip the first days of January (4 Jan 2027); `planner-project` and `planner-weekly` do this. In monthly mode, pages of one month share a column width, so a 15-day page leaves one slot empty above a 16-day page; in fixed mode all columns are the same. With `arrange: across` each page fills its own width instead.
- `arrange`: `across` puts the pages side by side (the paper turns sideways); the default stacks them down the roll.
- `flush`: no side padding, so day columns run edge to edge. A column line is drawn at every fold.
- `clearMonthHeader`: column lines and weekend shading start under the header labels (year, quarter, cycles, month, week number) instead of running behind them.
- `weekend`: `shade` shades Saturday and Sunday. It is not combined with striped bands (weekends stay unshaded if you ask for both) unless `overStripes` is set, which draws the weekend shading under the stripes, with the stripes a step darker across weekend columns.
- `weekDivider` / `columnLines`: a heavier line where a new week starts (set by `--week-start`) and light lines between the other days. `weekDividerColor` and `columnLineColor` set their colours by name (`magenta`, `gray`, `lightgray`, `darkgray`, ...; the defaults are `gray` and `lightgray`). The yearly, project and weekly planners make the week line magenta, as in the original.
- `bands`: `count` horizontal bands in the body, with `stripes` (alternate bands shaded, and `invert` to shade the first band instead of the second), `hairlines`, and `hours` labels (`none`, `left`, `right`, `both`, or `inside` for the first column of each page; `first` hour, `perBand` hours, `pad` for a leading zero, `color`).
- `labels`:
  - `month`: `auto` is above the 1st for monthly pagination and vertical in the 1st's column for fixed; or `top`, `vertical`, `none`. `monthEveryPage` also names the month at the start of a page that opens mid-month.
  - `weekday`: `short` is three letters, or `letter`, `none`. `weekdayTop` and `weekdayBottom` choose where it goes; `dayHeader: "inline"` puts the day number and the weekday after it on one top row.
  - `digitsTop`, `digitsBottom`, `digitsBottomColor`: the day numbers. Bottom text reads bottom to top: weekday, day number, then the month on the 1st (when `month` is `vertical`), with the week label one row further up.
  - `weekNumbers` (a top row), `weekNumberBottom` ("Week N" in the footer), `weekNumberBottomLeft` ("Week N" at the bottom left of each page, under the body) and `weekNumberPrefix` (text before the number, e.g. `Week `).
  - `year` and `quarter`: labels along the top, on the first column and where a year or quarter starts. The year follows the quarter on the same line, e.g. "Q1 2027", and only gets a row of its own when there is no quarter label. `quarter` is `weeks` for 13-week fiscal quarters starting at weeks 1, 14, 27 and 40 (the year turns over at week 1), or `months` for calendar quarters.
  - `quarterColor` and `cycleColor`: the colour names for the quarter label and the "Cycle N" label (`gray` unless set; `planner-project` makes the quarter label `magenta`).
  - `cycles`: optional, off unless set (used by `planner-project`). `{ "weeks": 6, "perQuarter": 2 }` draws a line for each of `perQuarter` cycles of `weeks` weeks in every 13-week fiscal quarter, then a lighter "Buffer" line for the rest of the quarter (6 + 6 + 1 week).
  - `monthWatermark`: a big, pale month name running left to right across the days, starting at the column of the 1st and of the first column. Size it with `fontSizes.monthWatermark`, or relative to the template's month size with `monthWatermarkScale`; `monthWatermarkOffset` moves it down from the top of the body, in points; with hour rows its baseline snaps down onto the nearest row line.
  - `moon`: optional, off unless set (used by `planner-weekly`). `{}` shows the principal moon phases next to the day number in the inline day header; `utcOffset` and `southern` adjust the day and the hemisphere.
- `fontSizes`: optional absolute sizes in points (`days`, `weekday`, `weekNumber`, `month`, `monthVertical`, `monthWatermark`, `year`, `quarter`, `cycle`, `hours`). Defaults come from the template's `fonts`. Nothing is resized automatically, so narrow columns need smaller sizes.
- `padding`: `x`, `top`, `bottom` in inches.

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
- Colours are turned into CMYK by value in `Classes/outputPDF.js`, so a new gray added to `Classes/myColors.js` needs a matching line there or it prints as RGB
- The weekly planner's moon phases use [`astronomia`](https://github.com/commenthol/astronomia) (MIT), an implementation of Meeus' *Astronomical Algorithms*

## Credits

- Code by [Alex Brovkin](https://github.com/brovalex)
- A big thank you to the many people who provided feedback on the code, and the printed calendars

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You may use, distribute, and modify this software under the terms of the AGPL. This ensures that any modifications or derivative works that you distribute, even if accessed over a network, are also released under the AGPL. For full details, see the [LICENSE](./LICENSE) file.