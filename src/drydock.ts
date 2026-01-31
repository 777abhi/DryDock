import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { scanFile } from './scanner';

interface Occurrence {
    project: string;
    file: string;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: drydock <files_or_directories>');
        process.exit(1);
    }

    const entries: string[] = [];

    // Expand directories to globs
    const patterns = args.map(arg => {
        if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
            return path.join(arg, '**', '*');
        }
        return arg;
    });

    try {
        const files = await fg(patterns, {
            dot: false,
            ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.idea/**', '**/.vscode/**'],
            absolute: true
        });

        const index = new Map<string, Occurrence[]>();

        for (const file of files) {
            // Only scan files
            if (!fs.statSync(file).isFile()) continue;

            // Maybe filter by extension?
            // The scanner will fallback to generic txt if unknown, which is fine, but might be slow for binary files.
            // I'll skip common binary extensions or just try-catch inside scanner (which I did).

            try {
               const result = scanFile(file);
               if (result) {
                   if (!index.has(result.hash)) {
                       index.set(result.hash, []);
                   }
                   index.get(result.hash)!.push({
                       project: result.project,
                       file: path.relative(process.cwd(), file)
                   });
               }
            } catch (err) {
                console.warn(`Error scanning ${file}:`, err);
            }
        }

        // Convert Map to Object for JSON output
        const output: Record<string, Occurrence[]> = {};
        for (const [hash, occurrences] of index.entries()) {
            // Optional: Filter out unique hashes if we only want duplicates?
            // "detects code duplication". Usually implies showing ONLY duplicates.
            // But "Create a central map... key is code hash... value is array".
            // If array has length 1, it's not a duplicate.
            // I'll output everything for the index, or filter?
            // "The utility must... detect code duplication".
            // Phase 1 just says "Create a central map".
            // I'll output the whole map. A frontend/viewer can filter.
            // Or I can filter here.
            // Given "DryDock... utility that detects code duplication", finding duplicates is the goal.
            // I will output ONLY hashes with > 1 occurrence to reduce noise, unless a flag is passed.
            // But the prompt example shows: { "hash": [{project: "Alpha"}, {project: "Beta"}] } -> This is > 1.
            // What if I have just one file? { "hash": [{project: "Alpha"}] }
            // I'll include all for now as "Indexing" implies building the index.

            output[hash] = occurrences;
        }

        console.log(JSON.stringify(output, null, 2));

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
