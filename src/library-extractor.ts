import * as fs from 'fs';
import * as path from 'path';
import { DryDockReport, CrossProjectLeakage } from './types';

export class LibraryExtractor {
    private inferLicense(content: string): string {
        const text = content.toLowerCase();
        if (text.includes('mit license') || text.includes('license: mit')) {
            return 'MIT';
        }
        if (text.includes('apache license') || text.includes('apache 2.0') || text.includes('license: apache')) {
            return 'Apache-2.0';
        }
        if (text.includes('gpl-3.0') || text.includes('gnu general public license v3')) {
            return 'GPL-3.0';
        }
        if (text.includes('bsd 3-clause') || text.includes('bsd-3-clause')) {
            return 'BSD-3-Clause';
        }
        if (text.includes('bsd 2-clause') || text.includes('bsd-2-clause')) {
            return 'BSD-2-Clause';
        }
        return 'ISC';
    }

    public extract(report: DryDockReport, threshold: number, outputDir: string): void {
        const candidates = report.cross_project_leakage.filter(item => item.score >= threshold);

        if (candidates.length === 0) {
            console.log(`No cross-project leakage items meet the extraction threshold of ${threshold}.`);
            return;
        }

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        let extractedCount = 0;

        for (const candidate of candidates) {
            if (candidate.occurrences.length === 0) continue;

            const libName = `shared-lib-${candidate.hash.substring(0, 12)}`;
            const libDir = path.join(outputDir, libName);

            if (!fs.existsSync(libDir)) {
                fs.mkdirSync(libDir, { recursive: true });
            }

            // Copy source file to index.js
            const sourceOccurrence = candidate.occurrences[0];
            const sourceFile = typeof sourceOccurrence === 'string' ? sourceOccurrence : sourceOccurrence.file;
            const fullSourcePath = path.resolve(process.cwd(), sourceFile);

            let license = 'ISC';
            if (fs.existsSync(fullSourcePath)) {
                const content = fs.readFileSync(fullSourcePath, 'utf8');
                license = this.inferLicense(content);
                fs.copyFileSync(fullSourcePath, path.join(libDir, 'index.js'));
            } else if (fs.existsSync(sourceFile)) {
                const content = fs.readFileSync(sourceFile, 'utf8');
                license = this.inferLicense(content);
            }

            // Generate package.json
            const packageJson = {
                name: libName,
                version: '1.0.0',
                description: `Automatically extracted shared library for duplicate hash ${candidate.hash}`,
                main: 'index.js',
                scripts: {
                    test: 'echo "Error: no test specified" && exit 1'
                },
                keywords: ['dry-dock', 'shared-library', 'auto-extracted'],
                author: 'DryDock Auto-Extractor',
                license: license
            };

            fs.writeFileSync(path.join(libDir, 'package.json'), JSON.stringify(packageJson, null, 2));

            if (!fs.existsSync(fullSourcePath)) {
                // If it's a test environment where files might just be mocked and not exist relative to cwd
                // we can attempt to just use the path as-is if it's absolute
                if (fs.existsSync(sourceFile)) {
                     fs.copyFileSync(sourceFile, path.join(libDir, 'index.js'));
                } else {
                     console.warn(`Warning: Could not find source file ${sourceFile} to copy to ${libName}/index.js`);
                     fs.writeFileSync(path.join(libDir, 'index.js'), '// Source file could not be found during extraction.\n');
                }
            }

            extractedCount++;
        }

        console.log(`Successfully extracted ${extractedCount} shared libraries to ${outputDir}`);
    }
}
