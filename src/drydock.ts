import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { scanFile } from './scanner';

interface Occurrence {
    project: string;
    file: string;
}

interface InternalDuplicate {
    hash: string;
    lines: number;
    frequency: number;
    score: number;
    project: string;
    occurrences: string[];
}

interface CrossProjectLeakage {
    hash: string;
    lines: number;
    frequency: number;
    spread: number;
    score: number;
    projects: string[];
    occurrences: Occurrence[];
}

interface DryDockReport {
    internal_duplicates: InternalDuplicate[];
    cross_project_leakage: CrossProjectLeakage[];
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

        const index = new Map<string, { occurrences: Occurrence[], lines: number }>();

        for (const file of files) {
            // Only scan files
            if (!fs.statSync(file).isFile()) continue;

            try {
               const result = scanFile(file);
               if (result) {
                   if (!index.has(result.hash)) {
                       index.set(result.hash, { occurrences: [], lines: result.lines });
                   }
                   index.get(result.hash)!.occurrences.push({
                       project: result.project,
                       file: path.relative(process.cwd(), file)
                   });
               }
            } catch (err) {
                console.warn(`Error scanning ${file}:`, err);
            }
        }

        const internal_duplicates: InternalDuplicate[] = [];
        const cross_project_leakage: CrossProjectLeakage[] = [];

        for (const [hash, data] of index.entries()) {
            const frequency = data.occurrences.length;
            // Only report duplicates
            if (frequency <= 1) continue;

            const projects = Array.from(new Set(data.occurrences.map(o => o.project)));
            const spread = projects.length;
            const lines = data.lines;
            // RefactorScore = P (Spread) * F (Frequency) * L (Lines)
            const score = spread * frequency * lines;

            if (spread > 1) {
                cross_project_leakage.push({
                    hash,
                    lines,
                    frequency,
                    spread,
                    score,
                    projects,
                    occurrences: data.occurrences
                });
            } else {
                internal_duplicates.push({
                    hash,
                    lines,
                    frequency,
                    score,
                    project: projects[0],
                    occurrences: data.occurrences.map(o => o.file)
                });
            }
        }

        const report: DryDockReport = {
            internal_duplicates: internal_duplicates.sort((a, b) => b.score - a.score),
            cross_project_leakage: cross_project_leakage.sort((a, b) => b.score - a.score)
        };

        // Save to drydock-report.json
        fs.writeFileSync('drydock-report.json', JSON.stringify(report, null, 2));

        // Also output to console for the current CLI behavior/tests
        console.log(JSON.stringify(report, null, 2));

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
