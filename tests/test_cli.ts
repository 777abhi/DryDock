import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const fixtureRoot = path.join(__dirname, 'cli_fixture');

function setup() {
    if (fs.existsSync(fixtureRoot)) {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }

    // Proj A
    fs.mkdirSync(path.join(fixtureRoot, 'projA'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'projA', 'package.json'), '{}');
    fs.writeFileSync(path.join(fixtureRoot, 'projA', 'main.ts'), 'console.log("hello");');

    // Proj B (Duplicate)
    fs.mkdirSync(path.join(fixtureRoot, 'projB'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'projB', 'go.mod'), '');
    fs.writeFileSync(path.join(fixtureRoot, 'projB', 'script.ts'), 'console.log("hello");');

    // Proj C (Unique)
    fs.mkdirSync(path.join(fixtureRoot, 'projC'), { recursive: true });
    // .git usually is a directory, but file works for exists check
    fs.mkdirSync(path.join(fixtureRoot, 'projC', '.git'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'projC', 'unique.ts'), 'console.log("world");');
}

function run() {
    setup();

    try {
        // We pass fixtureRoot to the CLI.
        const reportPath = 'drydock-report.json';
        if (fs.existsSync(reportPath)) {
            fs.unlinkSync(reportPath);
        }

        const cmd = `npx ts-node src/drydock.ts ${fixtureRoot}`;
        const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });

        // Check if report file exists
        if (!fs.existsSync(reportPath)) {
            console.error('FAIL: drydock-report.json was not created.');
            process.exit(1);
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

        // Verify schema structure
        if (!report.internal_duplicates || !report.cross_project_leakage) {
            console.error('FAIL: Report schema mismatch.');
            process.exit(1);
        }

        // Check for leakage between projA and projB
        const leakageEntry = report.cross_project_leakage.find((v: any) => v.frequency === 2);

        if (leakageEntry) {
            console.log('PASS: Found leakage entry.');
            const projects = leakageEntry.projects.sort();
            if (JSON.stringify(projects) === JSON.stringify(['projA', 'projB'])) {
                console.log('PASS: Projects in leakage identified correctly.');
            } else {
                console.error('FAIL: Leakage projects mismatch:', projects);
                process.exit(1);
            }

            // Verify RefactorScore components
            if (leakageEntry.spread === 2 && leakageEntry.frequency === 2) {
                console.log('PASS: Leakage metrics correct.');
            } else {
                console.error('FAIL: Leakage metrics mismatch:', leakageEntry);
                process.exit(1);
            }
        } else {
            console.error('FAIL: No leakage entry found.');
            process.exit(1);
        }

        // Unique entries (frequency 1) should NOT be in the report
        const totalEntries = report.internal_duplicates.length + report.cross_project_leakage.length;
        const uniqueInInternal = report.internal_duplicates.some((v: any) => v.frequency === 1);
        const uniqueInLeakage = report.cross_project_leakage.some((v: any) => v.frequency === 1);

        if (uniqueInInternal || uniqueInLeakage) {
            console.error('FAIL: Unique entries (frequency=1) should be filtered out.');
            process.exit(1);
        } else {
            console.log('PASS: Unique entries correctly filtered out.');
        }

    } catch (e) {
        console.error('FAIL: CLI execution failed', e);
        process.exit(1);
    } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
}

run();
