import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const tempRoot = path.join(__dirname, '..', 'temp_export');

function setup() {
    if (fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(tempRoot, { recursive: true });

    // Project_A
    const projA = path.join(tempRoot, 'Project_A');
    fs.mkdirSync(projA, { recursive: true });
    fs.writeFileSync(path.join(projA, 'package.json'), '{}');

    // Project_B
    const projB = path.join(tempRoot, 'Project_B');
    fs.mkdirSync(projB, { recursive: true });
    fs.writeFileSync(path.join(projB, 'package.json'), '{}');

    // Shared 60 lines function
    const sharedContent = 'console.log("shared code");\n'.repeat(60);
    fs.writeFileSync(path.join(projA, 'shared.ts'), sharedContent);
    fs.writeFileSync(path.join(projB, 'shared.ts'), sharedContent);
}

function verify() {
    setup();

    try {
        ['json', 'csv', 'html', 'xml'].forEach(ext => {
             const f = path.join(process.cwd(), `drydock-report.${ext}`);
             if (fs.existsSync(f)) fs.unlinkSync(f);
        });

        console.log('Running scan with --formats...');
        const cmd = `npx ts-node src/drydock.ts ${path.join(tempRoot, 'Project_A')} ${path.join(tempRoot, 'Project_B')} --formats json,csv,junit,html`;
        const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
        console.log('CLI Output:', output);

        // Verify files exist
        const reportJson = path.join(process.cwd(), 'drydock-report.json');
        const reportCsv = path.join(process.cwd(), 'drydock-report.csv');
        const reportXml = path.join(process.cwd(), 'drydock-report.xml');
        const reportHtml = path.join(process.cwd(), 'drydock-report.html');

        if (!fs.existsSync(reportJson)) throw new Error('drydock-report.json missing');
        if (!fs.existsSync(reportCsv)) throw new Error('drydock-report.csv missing');
        if (!fs.existsSync(reportXml)) throw new Error('drydock-report.xml missing');
        if (!fs.existsSync(reportHtml)) throw new Error('drydock-report.html missing');

        // Verify CSV content
        const csvContent = fs.readFileSync(reportCsv, 'utf-8');
        if (!csvContent.includes('Cross-Project') || !csvContent.includes('Project_A, Project_B') || !csvContent.includes('shared.ts')) {
            throw new Error('CSV content verification failed');
        }

        // Verify XML content
        const xmlContent = fs.readFileSync(reportXml, 'utf-8');
        if (!xmlContent.includes('<testsuite name="Cross Project Leakage"')) {
             throw new Error('XML content verification failed: Missing Cross Project testsuite');
        }
        if (!xmlContent.includes('lines shared across')) {
             throw new Error('XML content verification failed: Missing failure message');
        }

        // Verify HTML content
        const htmlContent = fs.readFileSync(reportHtml, 'utf-8');
        // Check for injected JSON data.
        if (!htmlContent.includes('reportData = {') && !htmlContent.includes('"cross_project_leakage":[')) {
             throw new Error('HTML content verification failed: Injected data not found');
        }

        console.log('SUCCESS: Export Verification Passed.');

    } catch (e) {
        console.error('FAILURE:', e);
        process.exit(1);
    } finally {
        if (fs.existsSync(tempRoot)) {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    }
}

verify();
