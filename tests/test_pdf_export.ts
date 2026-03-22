import * as fs from 'fs';
import * as path from 'path';
import { exportToPDF } from '../src/reporter';
import { DryDockReport } from '../src/types';

const mockReport: DryDockReport = {
    internal_duplicates: [{
        hash: 'hash2', lines: 40, complexity: 2, frequency: 2, score: 80, project: 'Project_A', occurrences: ['internal1.ts', 'internal2.ts']
    }],
    cross_project_leakage: [{
        hash: 'hash1', lines: 60, complexity: 5, frequency: 2, spread: 2, score: 339.41, projects: ['Project_A', 'Project_B'], occurrences: [{project: 'Project_A', file: 'shared.ts'}, {project: 'Project_B', file: 'shared.ts'}]
    }]
};

async function run() {
    const pdfPath = path.join(__dirname, 'test_report.pdf');
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    await exportToPDF(mockReport, pdfPath);

    if (fs.existsSync(pdfPath)) {
        console.log('PASS: PDF file generated successfully.');
        fs.unlinkSync(pdfPath);
    } else {
        console.error('FAIL: PDF file was not generated.');
        process.exit(1);
    }
}
run();
