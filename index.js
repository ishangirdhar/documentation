import fs from 'fs/promises';
import path from 'path';

const DIST_FOLDER = 'dist';
const OUTPUT_EXTENSION = '.md';
const FILE_SUFFIX = '.mdoc';

/**
 * Find all .mdoc files in a directory
 * @param dir
 * @returns {Promise<*[]>}
 */
async function findMarkdocFiles(dir) {
    const files = await fs.readdir(dir, {withFileTypes: true});
    let markdocFiles = [];

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            markdocFiles = markdocFiles.concat(await findMarkdocFiles(fullPath));
        } else if (path.extname(file.name) === FILE_SUFFIX) {
            markdocFiles.push(fullPath);
        }
    }

    return markdocFiles;
}

/**
 * Convert each .mdoc file to its own .md file, mirroring the source
 * directory structure inside the dist folder.
 * @param files
 * @param sourcePath
 * @returns {Promise<void>}
 */
async function convertFiles(files, sourcePath) {
    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // Preserve the directory structure relative to the source path.
        const relativePath = path.relative(sourcePath, file);
        const outputPath = path.join(
            DIST_FOLDER,
            relativePath.replace(new RegExp(`${FILE_SUFFIX}$`), OUTPUT_EXTENSION)
        );

        await fs.mkdir(path.dirname(outputPath), {recursive: true});
        await fs.writeFile(outputPath, content);
        console.log(`Created file: ${outputPath}`);
    }
}

async function clearDistFolder() {
    // clear the dist folder
    await fs.rm(DIST_FOLDER, { force: true, recursive: true });
}

async function createDistFolder() {
    await clearDistFolder().catch();

    // create the dist folder if it doesn't exist
    try {
        await fs.access(DIST_FOLDER);
    } catch (e) {
        await fs.mkdir(DIST_FOLDER);
    }
}

/**
 * @name main
 * @returns {Promise<void>}
 */
async function main() {
    const sourcePath = process.argv[2];

    if (!sourcePath) {
        console.error('Please provide a source path as an argument.');
        process.exit(1);
    }

    try {
        await createDistFolder();

        const files = await findMarkdocFiles(sourcePath);
        await convertFiles(files, sourcePath);
        console.log(`Converted ${files.length} file(s) to markdown in the "dist" folder.`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

void main();
