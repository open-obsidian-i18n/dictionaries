
const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '../plugins');
const THEMES_DIR = path.join(__dirname, '../themes');
const MANIFEST_FILE = path.join(__dirname, '../manifest.json');
const REPO_URL_BASE = 'https://raw.githubusercontent.com/open-obsidian-i18n/dictionaries/main';

function loadManifest() {
    if (fs.existsSync(MANIFEST_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
        } catch (e) {
            console.warn('Failed to parse existing manifest, creating new one.');
        }
    }
    return {
        lastUpdated: new Date().toISOString(),
        contributors: [],
        plugins: [],
        themes: []
    };
}

function calculateProgress(dict) {
    let total = 0;
    let translated = 0;

    for (const key in dict) {
        if (key === '$meta') continue;
        total++;
        if (dict[key] && dict[key].trim() !== '') {
            translated++;
        }
    }

    if (total === 0) return 0;
    return Math.round((translated / total) * 100);
}

function scanDirectory(type) {
    const baseDir = type === 'plugins' ? PLUGINS_DIR : THEMES_DIR;
    const items = [];

    if (!fs.existsSync(baseDir)) return items;

    const dirs = fs.readdirSync(baseDir);

    for (const dir of dirs) {
        const dirPath = path.join(baseDir, dir);
        if (!fs.statSync(dirPath).isDirectory()) continue;

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            let content;
            try {
                content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                console.error(`Error parsing ${filePath}:`, e);
                continue;
            }

            const meta = content.$meta;
            if (!meta) {
                console.warn(`Skipping ${filePath}: Missing $meta`);
                continue;
            }

            const item = {
                locale: meta.locale,
                dictVersion: meta.dictVersion || Date.now().toString(),
                progress: calculateProgress(content),
                downloadUrl: `${REPO_URL_BASE}/${type}/${encodeURIComponent(dir)}/${encodeURIComponent(file)}`
            };

            if (type === 'plugins') {
                item.pluginId = meta.pluginId;
            } else {
                item.themeName = meta.themeName;
            }

            items.push(item);
        }
    }
    return items;
}

function main() {
    const currentManifest = loadManifest();

    const plugins = scanDirectory('plugins');
    const themes = scanDirectory('themes');

    const newManifest = {
        lastUpdated: new Date().toISOString(),
        contributors: currentManifest.contributors || [],
        plugins: plugins,
        themes: themes
    };

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(newManifest, null, 2));
    console.log('Manifest generated successfully.');
}

main();
