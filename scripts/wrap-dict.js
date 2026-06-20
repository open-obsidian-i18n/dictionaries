/**
 * wrap-dict.js — Wraps a plain dictionary JSON with $meta header
 *
 * Usage: node scripts/wrap-dict.js <pluginId> <version> <locale> <input.json> [output.json]
 *
 * If output.json is omitted, prints to stdout.
 *
 * Input JSON should be flat key-value pairs:
 *   { "original text": "original text", ... }
 *
 * Output JSON includes $meta:
 *   {
 *     "$meta": { "pluginId": "...", "pluginVersion": "...", "dictVersion": "...", "locale": "en" },
 *     "original text": "original text",
 *     ...
 *   }
 */

const fs = require('fs');
const path = require('path');

function main() {
    const [, , pluginId, pluginVersion, locale, inputPath, outputPath] = process.argv;

    if (!pluginId || !pluginVersion || !locale || !inputPath) {
        console.error('Usage: node scripts/wrap-dict.js <pluginId> <version> <locale> <input.json> [output.json]');
        process.exit(1);
    }

    // Read input
    let dict;
    try {
        dict = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch (e) {
        console.error(`Error reading ${inputPath}:`, e.message);
        process.exit(1);
    }

    // Strip existing $meta if present (from re-exports)
    const { $meta: _, ...cleanDict } = dict;

    // Build output
    const output = {
        $meta: {
            pluginId,
            pluginVersion,
            dictVersion: Date.now().toString(),
            locale,
            description: `Exported builtin dictionary for ${locale}`,
        },
        ...cleanDict,
    };

    const json = JSON.stringify(output, null, 2) + '\n';

    if (outputPath) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, json);
        console.log(`Written: ${outputPath}`);
    } else {
        process.stdout.write(json);
    }
}

main();
