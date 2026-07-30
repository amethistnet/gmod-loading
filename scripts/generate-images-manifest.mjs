import {readdir, writeFile} from "node:fs/promises";
import path from "node:path";

const imageExtensions = new Set([
    ".avif",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".webp",
]);

const publicDir = path.resolve("public");
const imagesDir = path.join(publicDir, "images");
const manifestPath = path.join(publicDir, "images-manifest.json");

async function collectImages(dir) {
    const entries = await readdir(dir, {withFileTypes: true});
    const images = [];

    for (const entry of entries) {
        if (entry.name.startsWith(".")) {
            continue;
        }

        const absolutePath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            images.push(...await collectImages(absolutePath));
            continue;
        }

        if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) {
            continue;
        }

        images.push(`/${path.relative(publicDir, absolutePath).split(path.sep).join("/")}`);
    }

    return images;
}

const images = (await collectImages(imagesDir)).sort((a, b) => a.localeCompare(b));

await writeFile(manifestPath, `${JSON.stringify(images, null, 2)}\n`);

console.log(`Wrote ${images.length} image paths to ${path.relative(process.cwd(), manifestPath)}`);
