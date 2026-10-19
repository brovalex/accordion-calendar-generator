import config from 'config';

// A preset ("meta template") bundles every layout setting. Presets can `extend` other presets,
// so a custom one in config/local.json only needs to list what it changes. On top of that,
// individual values can be overridden on the fly with dotted paths, e.g. "bands.stripes=true".

const isObject = (x) => x && typeof x === 'object' && !Array.isArray(x)

export function deepMerge (base, over) {
    const out = { ...base }
    Object.keys(over).forEach((k) => {
        out[k] = (isObject(base[k]) && isObject(over[k])) ? deepMerge(base[k], over[k]) : over[k]
    })
    return out
}

function parseValue (raw) {
    if (raw === 'true') return true
    if (raw === 'false') return false
    if (raw !== '' && !isNaN(Number(raw))) return Number(raw)
    return raw
}

// "a.b.c=value" -> { a: { b: { c: value } } }
export function parseOverride (assignment) {
    const eq = assignment.indexOf('=')
    if (eq < 1) throw new Error(`--set expects key=value (got "${assignment}")`)
    const path = assignment.slice(0, eq).split('.')
    const out = {}
    path.reduce((node, key, i) => {
        node[key] = (i === path.length - 1) ? parseValue(assignment.slice(eq + 1)) : {}
        return node[key]
    }, out)
    return out
}

export function presetNames () {
    return Object.keys(config.get('presets'))
}

export function resolvePreset (name, overrides = []) {
    const presets = JSON.parse(JSON.stringify(config.get('presets')))
    const resolve = (n, seen) => {
        if (!presets[n]) throw new Error(`preset must be one of: ${Object.keys(presets).join(', ')} (got "${n}")`)
        if (seen.includes(n)) throw new Error(`preset "${n}" extends itself: ${[...seen, n].join(' -> ')}`)
        const { extends: parent, ...own } = presets[n]
        return parent ? deepMerge(resolve(parent, [...seen, n]), own) : own
    }
    let preset = resolve(name, [])
    overrides.forEach((o) => { preset = deepMerge(preset, parseOverride(o)) })
    return { name, ...preset }
}
