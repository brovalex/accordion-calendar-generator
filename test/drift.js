// Golden-file drift check: generates a fixed set of calendars, normalizes the PDFs
// (inflated streams, no dates/IDs/xref) and compares them with stored goldens.
//
//   node test/drift.js            compare against the goldens
//   node test/drift.js --update   re-bless the goldens (review the diff in the golden repo)
//   node test/drift.js <name>...  only the named cases
//
// Goldens live outside this repo because they depend on private fonts and config/local.json:
//   GOLDEN_DIR   default: ../accordion-calendar-private/reference/golden
//   PRIVATE_DIR  default: ../accordion-calendar-private (config/local.json and fonts/ must match
//                what this checkout has installed, otherwise the run aborts)
import { execFileSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const privateDir = path.resolve(root, process.env.PRIVATE_DIR || '../accordion-calendar-private')
const goldenDir = path.resolve(root, process.env.GOLDEN_DIR || path.join(privateDir, 'reference/golden'))

const base = ['--start-year', '2027', '--start-month', '1', '--paper-margin', '0.5', '--comment', 'golden']
const grid = (template, weekStart, paper, extra = []) =>
    ['--template', template, '--week-start', weekStart, '--paper-size', paper, '--number-of-months', '12', '--preset', 'classic', ...extra]
const planner = (preset, template, months, extra = []) =>
    ['--template', template, '--week-start', '1', '--paper-size', 'roll', '--number-of-months', months, '--preset', preset, ...extra]

const cases = {
    'pocket-monday': [...base, ...grid('pocket', '1', 'strip')],
    'pocket-sunday': [...base, ...grid('pocket', '0', 'strip')],
    'purse-monday': [...base, ...grid('purse', '1', 'roll')],
    'purse-sunday': [...base, ...grid('purse', '0', 'roll')],
    'purse-leap-feb-2028': ['--start-year', '2028', '--start-month', '2', '--paper-margin', '0.5', '--comment', 'golden',
        '--template', 'purse', '--week-start', '1', '--paper-size', 'roll', '--number-of-months', '6', '--preset', 'classic'],
    'pocket-sunday-jul-2027': ['--start-year', '2027', '--start-month', '7', '--paper-margin', '0.5', '--comment', 'golden',
        '--template', 'pocket', '--week-start', '0', '--paper-size', 'strip', '--number-of-months', '6', '--preset', 'classic'],
    'planner-yearly': [...base, ...planner('planner-yearly', 'pocket-portrait', '12')],
    'planner-project': [...base, ...planner('planner-project', 'pocket-portrait', '4', ['--pages', '10'])],
    'planner-project-cycles': [...base, ...planner('planner-project-cycles', 'pocket-portrait', '4', ['--pages', '10'])],
    'planner-weekly': [...base, ...planner('planner-weekly', 'purse', '3')],
}

const sha = (buf) => crypto.createHash('sha256').update(typeof buf === 'string' ? Buffer.from(buf, 'latin1') : buf).digest('hex')

// Hash of every font/config file the goldens depend on, from the private repo.
function privateInputs() {
    const files = { 'config/local.json': path.join(privateDir, 'config/local.json') }
    for (const f of fs.readdirSync(path.join(privateDir, 'fonts')).sort()) files['fonts/' + f] = path.join(privateDir, 'fonts', f)
    return files
}

function checkEnvironment() {
    const inputs = privateInputs()
    const hashes = {}
    const problems = []
    for (const [rel, src] of Object.entries(inputs)) {
        hashes[rel] = sha(fs.readFileSync(src))
        const installed = path.join(root, rel)
        if (!fs.existsSync(installed)) problems.push(`${rel} is missing here (copy it from ${privateDir})`)
        else if (sha(fs.readFileSync(installed)) !== hashes[rel]) problems.push(`${rel} differs from the private repo's copy`)
    }
    if (problems.length) {
        console.error('Environment does not match the private repo, so the goldens would not apply:\n  ' + problems.join('\n  '))
        process.exit(2)
    }
    return hashes
}

// Make a pdfkit PDF comparable: inflate streams, drop dates, /ID and the xref table.
function normalize(pdf) {
    let s = pdf.toString('latin1')
    s = s.replace(/(?<!end)stream\n([\s\S]*?)\nendstream/g, (m, body) => {
        try { return 'stream\n' + zlib.inflateSync(Buffer.from(body, 'latin1')).toString('latin1') + '\nendstream' }
        catch (e) { throw new Error("could not inflate a PDF stream: " + e.message) }
    })
    s = s.replace(/\(D:\d{14}[^)]*\)/g, "(D:X)")
    s = s.replace(/\/ID\s*\[[^\]]*\]/g, "/ID [X]")
    s = s.replace(/\/Length \d+/g, '/Length N')
    s = s.replace(/^xref[\s\S]*$/m, '')
    return s
}

function generate(args) {
    const out = execFileSync('node', ['index.js', ...args], { cwd: root, encoding: 'utf8' })
    const file = out.match(/Output file: (.+)/)?.[1]?.trim()
    if (!file) throw new Error('no output file reported:\n' + out)
    const full = path.join(root, file)
    // the PDF is written asynchronously after the process prints its summary; it is closed by exit
    const pdf = fs.readFileSync(full)
    fs.unlinkSync(full)
    return normalize(pdf)
}

function firstDifference(a, b) {
    const x = a.split('\n'), y = b.split('\n')
    const n = Math.min(x.length, y.length)
    let diffs = 0, first = -1
    for (let i = 0; i < n; i++) if (x[i] !== y[i]) { diffs++; if (first < 0) first = i }
    diffs += Math.abs(x.length - y.length)
    if (first < 0) first = n
    return { diffs, line: first + 1, golden: x[first], actual: y[first], lines: [x.length, y.length] }
}

const args = process.argv.slice(2)
const update = args.includes('--update')
const names = args.filter((a) => !a.startsWith('--'))
for (const n of names) if (!cases[n]) { console.error(`unknown case "${n}". Known: ${Object.keys(cases).join(', ')}`); process.exit(2) }

const inputs = checkEnvironment()
const manifestFile = path.join(goldenDir, 'manifest.json')
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { inputs: {}, cases: {} }

if (!update) {
    const changed = Object.keys({ ...inputs, ...manifest.inputs }).filter((k) => inputs[k] !== manifest.inputs[k])
    if (changed.length) console.warn(`note: inputs changed since the goldens were made (${changed.join(', ')})`)
}

fs.mkdirSync(goldenDir, { recursive: true })
let failed = 0
for (const name of names.length ? names : Object.keys(cases)) {
    const actual = generate(cases[name])
    const goldenFile = path.join(goldenDir, name + '.norm.gz')
    const hash = sha(actual)
    if (update) {
        fs.writeFileSync(goldenFile, zlib.gzipSync(Buffer.from(actual, 'latin1'), { level: 9 }))
        manifest.cases[name] = { sha256: hash, args: cases[name] }
        console.log(`updated ${name}`)
        continue
    }
    if (!fs.existsSync(goldenFile)) { console.log(`MISSING ${name} (run with --update)`); failed++; continue }
    const golden = zlib.gunzipSync(fs.readFileSync(goldenFile)).toString('latin1')
    if (golden === actual) { console.log(`ok      ${name}`); continue }
    failed++
    const d = firstDifference(golden, actual)
    console.log(`DRIFT   ${name}: ${d.diffs} differing lines (golden ${d.lines[0]}, actual ${d.lines[1]}); first at line ${d.line}\n    golden: ${d.golden}\n    actual: ${d.actual}`)
}

if (update) {
    manifest.inputs = inputs
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
    console.log(`goldens written to ${goldenDir}`)
} else {
    console.log(failed ? `\n${failed} case(s) drifted` : '\nno drift')
    process.exit(failed ? 1 : 0)
}
