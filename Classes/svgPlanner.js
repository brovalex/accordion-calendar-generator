import * as dateFns from 'date-fns'
import SVGBase from './svgBase.js'
import { phaseDays, dayKey } from './moon.js'

console.log("-------------------------------------------")

// Planner layout: horizontal flow, day grain. Every page is a row of thin day columns, and the
// space between header and footer is the body that can be split into bands (e.g. hours).
//
//   [month]            monthly pagination: above the 1st of the month
//   [week number]      optional, on the first column of each week
//   [weekday]          1 or 3 letters; optional at the top (labels.weekdayTop)
//   [digit]
//   ...body: weekend shading and/or hour bands...
//   [month]            vertical, in the column of the 1st, right after its digit
//   [digit]            vertical, reading bottom to top: weekday, digit, month
//   [weekday]          optional, vertical
const CAP_HEIGHT = 0.71 // Roboto digits and capitals, as a fraction of the font size

export default class SVGPlanner extends SVGBase {
    constructor (calData, template) {
        super(calData, template)
        const o = calData.preset
        this.o = o
        this.weekStartsOn = calData.weekStartsOn
        this.pageW = this.inchToPx(template.width)
        this.pageH = this.inchToPx(template.height)
        this.bleedPx = this.inchToPx(this.paper.bleed)
        this.pad = {
            x: o.flush ? 0 : this.inchToPx(o.padding.x), // flush: columns run edge to edge, so days meet across the fold
            top: this.inchToPx(o.padding.top),
            bottom: this.inchToPx(o.padding.bottom)
        }

        const fonts = template.fonts
        const sizes = o.fontSizes ?? {}
        this.size = {
            digits: sizes.days ?? fonts.Days.size,
            weekday: sizes.weekday ?? fonts.DaysOfWeek.size,
            weekNumber: sizes.weekNumber ?? fonts.WeekNumber.size,
            month: sizes.month ?? fonts.MonthHeader.size,
            year: sizes.year ?? fonts.MonthHeader.size/2,
            quarter: sizes.quarter ?? fonts.Days.size,
            cycle: sizes.cycle ?? fonts.WeekNumber.size,
            monthWatermark: sizes.monthWatermark ?? fonts.MonthHeader.size*(o.labels.monthWatermarkScale ?? 1),
            monthVertical: sizes.monthVertical ?? fonts.MonthVertical?.size ?? fonts.Days.size,
            hours: sizes.hours ?? fonts.Hours?.size ?? fonts.WeekNumber.size
        }

        const labels = o.labels
        this.monthMode = labels.month === 'auto' ? (o.pagination.mode === 'monthly' ? 'top' : 'vertical') : labels.month
        if (!['top', 'vertical', 'none'].includes(this.monthMode)) throw new Error(`labels.month must be auto, top, vertical or none (got "${labels.month}")`)
        if (!['short', 'letter', 'none'].includes(labels.weekday)) throw new Error(`labels.weekday must be short, letter or none (got "${labels.weekday}")`)
        if (!['none', 'left', 'right', 'both', 'inside'].includes(o.bands.hours.labels)) throw new Error(`bands.hours.labels must be none, left, right, both or inside (got "${o.bands.hours.labels}")`)

        this.shadeWeekends = o.weekend.shade
        if (this.shadeWeekends && o.bands.stripes && !o.weekend.overStripes) { // overStripes: weekends are shaded over the stripes
            console.warn("Note: striped bands and shaded weekends would clash, so weekends are not shaded")
            this.shadeWeekends = false
        }

        // keeps the bounding box at trim size + bleed, which is what the crop marks are measured from
        this.mainGroup
            .rect(this.across ? calData.pages.length*this.pageW + 2*this.bleedPx : this.pageW + 2*this.bleedPx,
                  this.across ? this.pageH + 2*this.bleedPx : calData.pages.length*this.pageH + 2*this.bleedPx)
            .move(-this.bleedPx, -this.bleedPx)
            .fill('none')

        this.measureFooter(calData.pages)
        // cycles are counted from the first week 1 on the strip (or the first day, if it has none)
        const allDays = calData.pages.flatMap(pg => pg.days)
        this.cycleAnchor = allDays.find(d => dateFns.getDay(d) === this.weekStartsOn && this.weekNumber(d) === 1) ?? allDays[0]
        // moon: which calendar days hold a new, first quarter, full or last quarter moon (UTC unless labels.moon.utcOffset says otherwise)
        this.moonDays = o.labels.moon ? phaseDays(allDays, o.labels.moon.utcOffset ?? 0) : new Map()
        // pages of one month sit on top of each other, so they share one column width (set by the longest of them);
        // pages side by side never line up with each other, so each one just fills its own width
        const monthKey = (page) => dateFns.format(page.days[0], 'yyyy-MM')
        const longestInMonth = {}
        calData.pages.forEach((page) => {
            longestInMonth[monthKey(page)] = Math.max(longestInMonth[monthKey(page)] ?? 0, page.days.length)
        })
        this.overlays = [] // drawn over every page once all of them exist: { p, draw(group) } in page coordinates
        calData.pages.forEach((page, p) => {
            const pageGroup = this.mainGroup.group()
            this.drawPage(pageGroup, page, p, calData.pages.length, (!this.across && this.o.pagination.mode === 'monthly') ? longestInMonth[monthKey(page)] : page.days.length)
            pageGroup.transform({ translate: this.across ? [p*this.pageW, 0] : [0, p*this.pageH] })
        })
        this.overlays.forEach(({ p, draw }) => {
            const layer = this.mainGroup.group()
            layer.transform({ translate: this.across ? [p*this.pageW, 0] : [0, p*this.pageH] })
            draw(layer)
        })

        this.finish(calData.pages.length)
    }

    weekdayLabel = (day) => {
        const style = this.o.labels.weekday
        if (style === 'none') return ''
        return dateFns.format(day, style === 'letter' ? 'EEEEE' : 'EEE').toUpperCase()
    }
    // Monday weeks are numbered ISO style; with any other week start, the week holding 1 January is week 1
    weekNumber = (day) => {
        if (this.weekStartsOn === 1) return dateFns.getISOWeek(day)
        return dateFns.getWeek(day, { weekStartsOn: this.weekStartsOn, firstWeekContainsDate: 1 })
    }
    weekYear = (day) => {
        if (this.weekStartsOn === 1) return dateFns.getISOWeekYear(day)
        return dateFns.getWeekYear(day, { weekStartsOn: this.weekStartsOn, firstWeekContainsDate: 1 })
    }
    // Year and quarter a day belongs to, and whether it starts one. Quarters are 13-week blocks counted from week 1,
    // so they begin on the first day of a week (weeks 1, 14, 27, 40) and the year turns over at week 1.
    // labels.quarter: 'months' uses calendar quarters (starting on the 1st of Jan, Apr, Jul, Oct) instead.
    period = (day) => {
        if (this.o.labels.quarter === 'months') {
            const first = dateFns.isFirstDayOfMonth(day)
            return { year: day.getFullYear(), quarter: dateFns.getQuarter(day), startsQuarter: first && day.getMonth() % 3 === 0, startsYear: first && day.getMonth() === 0 }
        }
        const week = this.weekNumber(day)
        const weekStart = dateFns.getDay(day) === this.weekStartsOn
        return { year: this.weekYear(day), quarter: Math.min(4, Math.ceil(week / 13)), startsQuarter: weekStart && [1, 14, 27, 40].includes(week), startsYear: weekStart && week === 1 }
    }
    textWidth = (font, text, fontSize) => font.getMetrics(text, { fontSize }).width

    // footer reads bottom to top: weekday, then digit, then month. Its height is the same on every page.
    measureFooter = (pages) => {
        const labels = this.o.labels
        const gap = 3
        const items = []
        if (labels.weekdayBottom && labels.weekday !== 'none') {
            const longest = Math.max(...pages.flatMap(pg => pg.days.map(d => this.textWidth(this.textToSVG, this.weekdayLabel(d), this.size.weekday))))
            items.push({ key: 'weekday', length: longest })
        }
        if (labels.digitsBottom) items.push({ key: 'digits', length: this.textWidth(this.digitsToSVG, '88', this.size.digits) })
        if (labels.weekNumberBottom) items.push({ key: 'weekNumber', length: this.textWidth(this.weeksToSVG, 'Week 88', this.size.weekNumber), before: this.size.digits }) // starts one row above the digit's end
        if (this.monthMode === 'vertical') {
            const longest = Math.max(...[...Array(12)].map((_, m) => this.textWidth(this.textToSVG, dateFns.format(new Date(2000, m, 1), 'MMMM'), this.size.monthVertical)))
            items.push({ key: 'month', length: longest })
        }
        let offset = 0
        this.footer = {}
        items.forEach((item) => {
            offset += item.before ?? 0
            this.footer[item.key] = { offset, length: item.length }
            offset += item.length + gap
        })
        this.footerHeight = offset ? offset - gap : 0
    }

    rect = (g, x, y, w, h, color) => g.rect(w, h).move(x, y).fill(color)

    // text positioned by its baseline; `anchor` is 'left', 'center' or 'right'
    text = (g, font, str, x, baseline, fontSize, anchor, color) => {
        g.path(font.getD(str, { x, y: baseline, fontSize, anchor: `${anchor} baseline` })).fill(color)
    }
    // text turned to read bottom to top, starting at `startY`, with its glyphs centred on `centerX`
    verticalText = (g, font, str, centerX, startY, fontSize, color) => {
        const turned = g.group().attr('transform', `translate(${centerX + CAP_HEIGHT*fontSize/2} ${startY}) rotate(-90)`)
        turned.path(font.getD(str, { x: 0, y: 0, fontSize, anchor: 'left baseline' })).fill(color)
    }

    // small moon icon for a principal phase, centred on (cx, cy): new is a ring, full a disc, and the quarters a disc
    // half lit on the right (first quarter) or the left (last quarter), as seen from the northern hemisphere
    // (labels.moon.southern flips them)
    drawMoon = (g, phase, cx, cy, r) => {
        const color = this.colors.gray
        const ring = () => g.circle(2*r).center(cx, cy).fill('none').stroke({ color, width: 0.6 })
        if (phase === 'full') {
            g.circle(2*r).center(cx, cy).fill(color)
        } else if (phase === 'new') {
            ring()
        } else {
            const litRight = (phase === 'first') !== !!this.o.labels.moon.southern
            g.path(`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${litRight ? 1 : 0} ${cx} ${cy + r} Z`).fill(color)
            ring()
        }
    }

    // monthEveryPage: a page that opens mid-month names its month too, unless the next month's label follows too closely
    namesMonthAtPageStart = (days, colX, size) => this.o.labels.monthEveryPage && !dateFns.isFirstDayOfMonth(days[0]) && !days.some((d, j) =>
        j > 0 && dateFns.isFirstDayOfMonth(d) && colX(j) < colX(0) + 6 + this.textWidth(this.monthToSVG, dateFns.format(days[0], 'MMMM'), size))

    // labels.cycles = { weeks, cooldown }: e.g. 6 weeks of work and 2 weeks of cool-down, repeating from the anchor
    drawCycles = (g, days, colX, row) => {
        const { weeks, cooldown } = this.o.labels.cycles
        const build = weeks*7, length = (weeks + cooldown)*7
        const state = days.map((d) => {
            const index = dateFns.differenceInCalendarDays(d, this.cycleAnchor)
            if (index < 0) return null // before the first cycle
            const pos = index % length
            return { cycle: Math.floor(index/length) + 1, pos, cool: pos >= build }
        })
        const lineY = row.top + row.height - 3
        const tick = 6
        let i = 0
        while (i < days.length) {
            const s = state[i]
            if (!s) { i++; continue }
            let j = i
            while (j + 1 < days.length && state[j + 1] && state[j + 1].cool === s.cool && state[j + 1].cycle === s.cycle) j++
            const color = s.cool ? this.colors.lightgray : this.colors.gray
            this.rect(g, colX(i), lineY - (s.cool ? 0.25 : 0.5), colX(j + 1) - colX(i), s.cool ? 0.5 : 1, color)
            const first = s.cool ? build : 0
            const last = s.cool ? length - 1 : build - 1
            if (s.pos === first) this.rect(g, colX(i) - 0.5, lineY - tick/2, 1, tick, color)
            if (state[j].pos === last) this.rect(g, colX(j + 1) - 0.5, lineY - tick/2, 1, tick, color)
            if (s.pos === first) this.text(g, this.textToSVG, s.cool ? 'Cool-down' : `Cycle ${s.cycle}`, colX(i) + 2, lineY - 3, this.size.cycle, 'left', color)
            i = j + 1
        }
    }

    drawPage = (g, page, p, pageCount, slots) => {
        const o = this.o
        const days = page.days
        const n = days.length
        const W = this.pageW, H = this.pageH, bleed = this.bleedPx
        const colLeft = this.pad.x
        const colW = (W - 2*this.pad.x) / slots // a shorter page leaves its last slot(s) empty rather than stretching its columns
        const colX = (i) => colLeft + i*colW
        // the bleed reaches past the trim only on the outer edges of the whole strip
        const top = (this.across || p === 0) ? -bleed : 0
        const bottom = (this.across || p === pageCount - 1) ? H + bleed : H
        const left = (!this.across || p === 0) ? -bleed : 0
        const right = (!this.across || p === pageCount - 1) ? W + bleed : W

        // header, top down
        const rows = {}
        let y = this.pad.top
        const addRow = (key, height) => { rows[key] = { top: y, height }; y += height }
        if (o.labels.year && !o.labels.quarter) addRow('year', this.size.year*1.4)
        if (o.labels.quarter) addRow('quarter', this.size.quarter*1.4)
        if (o.labels.cycles) addRow('cycles', this.size.cycle*2.6)
        if (this.monthMode === 'top') addRow('month', this.size.month*1.4)
        if (o.labels.weekNumbers) addRow('weekNumber', this.size.weekNumber*1.6)
        // dayHeader 'inline': weekday and day number share one row, the weekday right after the number
        const weekdayTop = o.labels.weekday !== 'none' && o.labels.weekdayTop !== false
        if (o.labels.dayHeader === 'inline' && weekdayTop && o.labels.digitsTop) {
            addRow('days', Math.max(this.size.digits, this.size.weekday)*1.8)
        } else {
            if (weekdayTop) addRow('weekday', this.size.weekday*1.8)
            if (o.labels.digitsTop) addRow('digits', this.size.digits*1.8)
        }
        const bodyTop = y + (y > this.pad.top ? 2 : 0)
        const footerGap = this.footerHeight ? 3 : 0
        // weekNumberBottomLeft: "Week N" sits under the body at the left of the page
        const cornerHeight = o.labels.weekNumberBottomLeft ? this.size.weekNumber*1.8 : 0
        const bodyBottom = H - this.pad.bottom - this.footerHeight - footerGap - cornerHeight
        const bodyHeight = bodyBottom - bodyTop

        // clearMonthHeader: lines and weekend shading start under the header labels instead of running behind them
        const labelRows = ['year', 'quarter', 'cycles', 'month', 'weekNumber'].filter(k => rows[k])
        const lineTop = (o.clearMonthHeader && labelRows.length) ? Math.max(...labelRows.map(k => rows[k].top + rows[k].height)) : top

        // 1. weekend shading: runs of weekend columns become one rect, reaching into the bleed at the page edges.
        // It goes first, so stripes can sit over it.
        const weekendRuns = []
        if (this.shadeWeekends) {
            const weekend = (i) => [0, 6].includes(dateFns.getDay(days[i]))
            for (let i = 0; i < n; i++) {
                if (!weekend(i)) continue
                let j = i
                while (j + 1 < n && weekend(j + 1)) j++
                weekendRuns.push({ x0: i === 0 ? left : colX(i), x1: (j === n - 1 && n === slots) ? right : colX(j + 1) })
                i = j
            }
            weekendRuns.forEach(({ x0, x1 }) => this.rect(g, x0, lineTop, x1 - x0, bottom - lineTop, this.colors.verylightgray))
        }

        // 2. stripes: alternate bands, edge to edge. Over a weekend column they are a slightly darker gray, so both patterns show
        if (o.bands.stripes) {
            const stripe = this.colors[o.bands.stripeColor ?? 'verylightgray']
            const bandH = bodyHeight / o.bands.count
            for (let b = o.bands.invert ? 0 : 1; b < o.bands.count; b += 2) { // invert: shade the first band, not the second
                this.rect(g, left, bodyTop + b*bandH, right - left, bandH, stripe)
                weekendRuns.forEach(({ x0, x1 }) => this.rect(g, x0, bodyTop + b*bandH, x1 - x0, bandH, this.colors.stripegray))
            }
        }

        // 2b. month watermark: a big, pale month name running left to right across the days, starting at the column of the 1st
        // (and of the first column, so the strip's opening month is named even when it starts after the 1st) just under the
        // header. It is drawn later, in a layer over the whole strip, so it can run over a page fold without being covered.
        if (o.labels.monthWatermark) {
            days.forEach((day, i) => {
                const startsPage = i === 0 && (p === 0 || this.namesMonthAtPageStart(days, colX, this.size.monthWatermark))
                if (!(dateFns.isFirstDayOfMonth(day) || startsPage)) return
                const name = dateFns.format(day, 'MMMM')
                const size = this.size.monthWatermark
                const width = this.textWidth(this.monthToSVG, name, size)
                // in the first column the hour labels come first, so the name starts after them
                const startX = colX(i) + 2 + ((i === 0 && o.bands.hours.labels === 'inside') ? this.textWidth(this.weeksToSVG, '88', this.size.hours) + 10 : 0)
                const x = (p === pageCount - 1) ? Math.min(startX, W - width) : startX
                // with hour rows the baseline snaps down onto the nearest row line, so the name sits on the line between two hours
                let baseline = bodyTop + (o.labels.monthWatermarkOffset ?? 3) + CAP_HEIGHT*size
                if (o.bands.hours.labels !== 'none') {
                    const bandH = bodyHeight / o.bands.count
                    baseline = bodyTop + Math.max(1, Math.ceil((baseline - bodyTop) / bandH)) * bandH
                }
                this.overlays.push({ p, draw: (og) => this.text(og, this.monthToSVG, name, x, baseline, size, 'left', this.colors.palegray) })
            })
        }

        // 3. hairlines between bands, including the top and bottom of the body
        if (o.bands.hairlines) {
            const hairline = this.colors[o.bands.hairlineColor ?? 'lightgray']
            const bandH = bodyHeight / o.bands.count
            for (let b = 0; b <= o.bands.count; b++) {
                this.rect(g, left, bodyTop + b*bandH - 0.25, right - left, 0.5, hairline)
            }
        }

        // 4. column lines, darker where a new week starts
        // side by side, the first column of every page after the first also gets its line, so the rhythm carries over the fold
        for (let i = (this.across && p > 0) ? 0 : 1; i < n; i++) {
            const newWeek = dateFns.getDay(days[i]) === this.weekStartsOn
            if (newWeek && o.weekDivider) this.rect(g, colX(i) - 0.5, lineTop, 1, bottom - lineTop, this.colors.gray)
            else if (o.columnLines) this.rect(g, colX(i) - 0.25, lineTop, 0.5, bottom - lineTop, this.colors.lightgray)
        }

        // cycles: a line from the first to the last day of each build cycle, then a lighter one for its cool-down
        if (rows.cycles) this.drawCycles(g, days, colX, rows.cycles)

        // 5. hour labels at the top of each band: in the side padding, or (inside) in the first column of the page,
        // for flush layouts that have no padding
        if (o.bands.hours.labels !== 'none') {
            const bandH = bodyHeight / o.bands.count
            const sides = o.bands.hours.labels === 'both' ? ['left', 'right'] : [o.bands.hours.labels]
            for (let b = 0; b < o.bands.count; b++) {
                const hour = String((o.bands.hours.first + b*o.bands.hours.perBand) % 24).padStart(o.bands.hours.pad ? 2 : 0, '0')
                const baseline = bodyTop + b*bandH + this.size.hours*1.2
                if (o.bands.hours.labels === 'inside') {
                    this.text(g, this.weeksToSVG, hour, colX(0) + 3, baseline, this.size.hours, 'left', this.colors[o.bands.hours.color ?? 'gray'])
                    continue
                }
                sides.forEach((side) => {
                    this.text(g, this.weeksToSVG, hour, side === 'left' ? this.pad.x/2 : W - this.pad.x/2,
                        baseline, this.size.hours, 'center', this.colors.gray)
                })
            }
        }

        // 6. text
        days.forEach((day, i) => {
            const centerX = colX(i) + colW/2
            // year and quarter labels sit on the column that starts them, and on the very first column so the strip opens labelled
            const opening = p === 0 && i === 0
            // the year follows the quarter on the same baseline ("Q1 2027"); with no quarter row it gets a row of its own
            const parts = []
            const period = (rows.year || rows.quarter) ? this.period(day) : null
            if (rows.quarter && (opening || period.startsQuarter)) {
                parts.push({ row: 'quarter', str: `Q${period.quarter}`, font: this.textToSVG, size: this.size.quarter })
            }
            if (o.labels.year && (opening || period.startsYear)) {
                parts.push({ row: rows.quarter ? 'quarter' : 'year', str: String(period.year), font: this.monthToSVG, size: this.size.year, centeredOn: rows.quarter ? this.size.quarter : 0 })
            }
            const gap = 3
            const total = parts.reduce((sum, part, k) => sum + this.textWidth(part.font, part.str, part.size) + (k ? gap : 0), 0)
            let x = (p === pageCount - 1) ? Math.min(colX(i) + 2, W - total) : colX(i) + 2 // the last label must not run off the strip
            parts.forEach((part) => {
                // the year is centred on the quarter's cap height, not sitting on its baseline
                const baseline = rows[part.row].top + rows[part.row].height*0.75 - (part.centeredOn ? CAP_HEIGHT*(part.centeredOn - part.size)/2 : 0)
                this.text(g, part.font, part.str, x, baseline, part.size, 'left', this.colors.gray)
                x += this.textWidth(part.font, part.str, part.size) + gap
            })
            if (rows.weekNumber && (i === 0 || dateFns.getDay(day) === this.weekStartsOn)) {
                this.text(g, this.weeksToSVG, (o.labels.weekNumberPrefix ?? '') + this.weekNumber(day), colX(i) + 2,
                    rows.weekNumber.top + rows.weekNumber.height*0.75, this.size.weekNumber, 'left', this.colors.gray)
            }
            if (o.labels.weekNumberBottomLeft && i === 0) {
                this.text(g, this.weeksToSVG, (o.labels.weekNumberPrefix ?? '') + this.weekNumber(day), colX(0) + 3,
                    bodyBottom + cornerHeight*0.75, this.size.weekNumber, 'left', this.colors.gray)
            }
            if (rows.days) {
                const baseline = rows.days.top + (rows.days.height + CAP_HEIGHT*this.size.digits)/2
                const digits = dateFns.format(day, 'd')
                this.text(g, this.digitsToSVG, digits, colX(i) + 3, baseline, this.size.digits, 'left', this.colors.darkgray)
                this.text(g, this.textToSVG, this.weekdayLabel(day), colX(i) + 3 + this.textWidth(this.digitsToSVG, digits, this.size.digits) + 3, baseline, this.size.weekday, 'left', this.colors.gray)
                const moon = this.moonDays.get(dayKey(day))
                if (moon) this.drawMoon(g, moon, colX(i) + colW - 4.5 - this.size.digits*0.3, baseline - CAP_HEIGHT*this.size.digits/2, this.size.digits*0.3) // right aligned, level with the day number
            }
            if (rows.weekday) {
                this.text(g, this.textToSVG, this.weekdayLabel(day), centerX,
                    rows.weekday.top + (rows.weekday.height + CAP_HEIGHT*this.size.weekday)/2, this.size.weekday, 'center', this.colors.gray)
            }
            if (rows.digits) {
                this.text(g, this.digitsToSVG, dateFns.format(day, 'd'), centerX,
                    rows.digits.top + (rows.digits.height + CAP_HEIGHT*this.size.digits)/2, this.size.digits, 'center', this.colors.darkgray)
            }

            // footer, from the bottom edge upwards
            const footerStart = H - this.pad.bottom
            if (this.footer.digits) {
                this.verticalText(g, this.digitsToSVG, dateFns.format(day, 'd'), centerX, footerStart - this.footer.digits.offset, this.size.digits, this.colors[o.labels.digitsBottomColor ?? 'darkgray'])
            }
            if (this.footer.weekNumber && dateFns.getDay(day) === this.weekStartsOn) {
                this.verticalText(g, this.weeksToSVG, `Week ${this.weekNumber(day)}`, centerX, footerStart - this.footer.weekNumber.offset, this.size.weekNumber, this.colors.gray)
            }
            if (this.footer.weekday) {
                this.verticalText(g, this.textToSVG, this.weekdayLabel(day), centerX, footerStart - this.footer.weekday.offset, this.size.weekday, this.colors.gray)
            }
            const startsMonth = dateFns.isFirstDayOfMonth(day)
            // monthEveryPage: a page that opens mid-month names its month too, unless the next month's label follows too closely
            const namesPage = i === 0 && !startsMonth && this.namesMonthAtPageStart(days, colX, this.size.month)
            if (startsMonth || namesPage) {
                const name = dateFns.format(day, 'MMMM')
                if (this.footer.month && startsMonth) {
                    this.verticalText(g, this.textToSVG, name, centerX, footerStart - this.footer.month.offset, this.size.monthVertical, this.colors.gray)
                }
                if (rows.month) {
                    // never run off the page: a month label that would overflow is right-aligned to the last column
                    const width = this.textWidth(this.monthToSVG, name, this.size.month)
                    const x = Math.min(colX(i) + 2, W - this.pad.x - width)
                    this.text(g, this.monthToSVG, name, x, rows.month.top + this.size.month, this.size.month, 'left', this.colors.lightgray)
                }
            }
        })
    }
}
