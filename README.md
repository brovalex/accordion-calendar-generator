# Usage
Run `node index.js` and this will create a `calendar.pdf` print-ready file in the same folder. (Run `npm install` first obvi.)

Settings are adjusted at the top of the `calendar.js` file. 

# Todo/fix:
- [ ] last month month tracker does not end at right place
- [ ] errors in month tracker on last months

# Future work:
- [ ] need to argument passed to month tracker to take into account weekStartsOn
- [ ] weekend block is drawn on 6th day, need to make dynamic based on day
- [ ] remove clip if not used
- [ ] more optimized PDFs (don't generate elements that are out view)

# NOTES:
- Had to hack colour names in the CMYK colour conversion package, because an issue in the package itself doesn't allow for passing custom colours properly
- This font is not to be distributed or used for commercial purposes