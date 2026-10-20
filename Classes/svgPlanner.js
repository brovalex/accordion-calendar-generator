import * as dateFns from 'date-fns'
import SVGBase from './svgBase.js'

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
            monthVertical: sizes.monthVertical ?? fonts.MonthVertical?.size ?? fonts.Days.size,
            hours: sizes.hours ?? fonts.Hours?.size ?? fonts.WeekNumber.size
        }

        const labels = o.labels
        this.monthMode = labels.month === 'auto' ? (o.pagination.mode === 'monthly' ? 'top' : 'vertical') : labels.month
        if (!['top', 'vertical', 'none'].includes(this.monthMode)) throw new Error(`labels.month must be auto, top, vertical or none (got "${labels.month}")`)
        if (!['short', 'letter', 'none'].includes(labels.weekday)) throw new Error(`labels.weekday must be short, letter or none (got "${labels.weekday}")`)
        if (!['none', 'left', 'right', 'both'].includes(o.bands.hours.labels)) throw new Error(`bands.hours.labels must be none, left, right or both (got "${o.bands.hours.labels}")`)

        this.shadeWeekends = o.weekend.shade
        if (this.shadeWeekends && o.bands.stripes) {
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
        // pages of one month sit on top of each other, so they share one column width (set by the longest of them);
        // pages side by side never line up with each other, so each one just fills its own width
        const monthKey = (page) => dateFns.format(page.days[0], 'yyyy-MM')
        const longestInMonth = {}
        calData.pages.forEach((page) => {
            longestInMonth[monthKey(page)] = Math.max(longestInMonth[monthKey(page)] ?? 0, page.days.length)
        })
        calData.pages.forEach((page, p) => {
            const pageGroup = this.mainGroup.group()
            this.drawPage(pageGroup, page, p, calData.pages.length, (!this.across && this.o.pagination.mode === 'monthly') ? longestInMonth[monthKey(page)] : page.days.length)
            pageGroup.transform({ translate: this.across ? [p*this.pageW, 0] : [0, p*this.pageH] })
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
        if (this.monthMode === 'vertical') {
            const longest = Math.max(...[...Array(12)].map((_, m) => this.textWidth(this.textToSVG, dateFns.format(new Date(2000, m, 1), 'MMMM'), this.size.monthVertical)))
            items.push({ key: 'month', length: longest })
        }
        let offset = 0
        this.footer = {}
        items.forEach((item) => {
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
        if (this.monthMode === 'top') addRow('month', this.size.month*1.4)
        if (o.labels.weekNumbers) addRow('weekNumber', this.size.weekNumber*1.6)
        if (o.labels.weekday !== 'none' && o.labels.weekdayTop !== false) addRow('weekday', this.size.weekday*1.8)
        if (o.labels.digitsTop) addRow('digits', this.size.digits*1.8)
        const bodyTop = y + (y > this.pad.top ? 2 : 0)
        const footerGap = this.footerHeight ? 3 : 0
        const bodyBottom = H - this.pad.bottom - this.footerHeight - footerGap
        const bodyHeight = bodyBottom - bodyTop

        // 1. stripes: alternate bands, edge to edge
        if (o.bands.stripes) {
            const stripe = this.colors[o.bands.stripeColor ?? 'verylightgray']
            const bandH = bodyHeight / o.bands.count
            for (let b = 1; b < o.bands.count; b += 2) {
                this.rect(g, left, bodyTop + b*bandH, right - left, bandH, stripe)
            }
        }

        // 2. weekend shading: runs of weekend columns become one rect, reaching into the bleed at the page edges
        if (this.shadeWeekends) {
            const weekend = (i) => [0, 6].includes(dateFns.getDay(days[i]))
            for (let i = 0; i < n; i++) {
                if (!weekend(i)) continue
                let j = i
                while (j + 1 < n && weekend(j + 1)) j++
                const x0 = i === 0 ? left : colX(i)
                const x1 = (j === n - 1 && n === slots) ? right : colX(j + 1)
                this.rect(g, x0, top, x1 - x0, bottom - top, this.colors.verylightgray)
                i = j
            }
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
        // clearMonthHeader: the lines start under the month label instead of running through it
        const lineTop = (o.clearMonthHeader && rows.month) ? rows.month.top + rows.month.height : top
        for (let i = (this.across && p > 0) ? 0 : 1; i < n; i++) {
            const newWeek = dateFns.getDay(days[i]) === this.weekStartsOn
            if (newWeek && o.weekDivider) this.rect(g, colX(i) - 0.5, lineTop, 1, bottom - lineTop, this.colors.gray)
            else if (o.columnLines) this.rect(g, colX(i) - 0.25, lineTop, 0.5, bottom - lineTop, this.colors.lightgray)
        }

        // 5. hour labels in the side padding, at the top of each band
        if (o.bands.hours.labels !== 'none') {
            const bandH = bodyHeight / o.bands.count
            const sides = o.bands.hours.labels === 'both' ? ['left', 'right'] : [o.bands.hours.labels]
            for (let b = 0; b < o.bands.count; b++) {
                const hour = String((o.bands.hours.first + b*o.bands.hours.perBand) % 24)
                sides.forEach((side) => {
                    this.text(g, this.weeksToSVG, hour, side === 'left' ? this.pad.x/2 : W - this.pad.x/2,
                        bodyTop + b*bandH + this.size.hours*1.2, this.size.hours, 'center', this.colors.gray)
                })
            }
        }

        // 6. text
        days.forEach((day, i) => {
            const centerX = colX(i) + colW/2
            if (rows.weekNumber && (i === 0 || dateFns.getDay(day) === this.weekStartsOn)) {
                this.text(g, this.weeksToSVG, String(this.weekNumber(day)), colX(i) + 2,
                    rows.weekNumber.top + rows.weekNumber.height*0.75, this.size.weekNumber, 'left', this.colors.gray)
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
                this.verticalText(g, this.digitsToSVG, dateFns.format(day, 'd'), centerX, footerStart - this.footer.digits.offset, this.size.digits, this.colors.darkgray)
            }
            if (this.footer.weekday) {
                this.verticalText(g, this.textToSVG, this.weekdayLabel(day), centerX, footerStart - this.footer.weekday.offset, this.size.weekday, this.colors.gray)
            }
            if (dateFns.isFirstDayOfMonth(day)) {
                const name = dateFns.format(day, 'MMMM')
                if (this.footer.month) {
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
