import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const tempRoot = path.join(__dirname, 'temp_parallel');

function setup() {
    if (fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(tempRoot, { recursive: true });

    // Create 100 identical files to ensure they get chunked to workers
    for (let i = 0; i < 100; i++) {
        fs.writeFileSync(path.join(tempRoot, `file_${i}.ts`), `
            function add(a, b) {
                return a + b;
            }
        `);
    }

    // A distinct one to ensure it finds different hashes
    fs.writeFileSync(path.join(tempRoot, `file_distinct.ts`), `
        function subtract(a, b) {
            return a - b;
        }
    `);
}

function runTests() {
    setup();

    console.log('Running CLI scan on 101 files...');
    const outPath = path.join(__dirname, 'parallel-report.json');
    // We execute the CLI directly. If it uses parallel processing, it will be faster or at least work without crashing.
    try {
        const out = execSync(`npx ts-node src/drydock.ts scan ${tempRoot} --formats json`);
        const reportRaw = fs.readFileSync('drydock-report.json', 'utf8');
        const report = JSON.parse(reportRaw);

        // We expect the 'add' function to be found 100 times.
        const duplicates = report.internal_duplicates;
        if (!duplicates) {
             throw new Error("No duplicates array found.");
        }

        const addDup = duplicates.find((d: any) => d.frequency === 100);
        if (addDup) {
             console.log('PASS: Correctly found 100 occurrences of identical file block.');
        } else {
             console.error('FAIL: Could not find the expected duplicate with frequency 100.');
             process.exit(1);
        }

    } catch (e: any) {
        console.error('FAIL: Error running parallel scan test:', e.message);
        if (e.stdout) console.log(e.stdout.toString());
        if (e.stderr) console.error(e.stderr.toString());
        process.exit(1);
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
        if (fs.existsSync('drydock-report.json')) {
            fs.rmSync('drydock-report.json');
        }
    }
}

runTests();
