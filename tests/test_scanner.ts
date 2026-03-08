import * as fs from 'fs';
import * as path from 'path';
import { scanFile } from '../src/scanner';

const tempRoot = path.join(__dirname, 'temp_scanner');

function setup() {
    if (fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(tempRoot, { recursive: true });

    // Create package.json so identifyProject works (though we don't strictly test it here, scanFile uses it)
    fs.writeFileSync(path.join(tempRoot, 'package.json'), '{}');

    const code1 = `
function add(a, b) {
  return a + b;
}
`;

    const code2 = `
// This is a duplicate function with different names
function sum(x, y) {
    return x + y;
}
`;

    const complexCode = `
function complex(a, b) {
    if (a > b || b < 0) {
        for (let i = 0; i < 10; i++) {
            console.log(i);
        }
    } else if (a === b) {
        while(true) { break; }
    }
    return a ? b : a;
}
`;

    fs.writeFileSync(path.join(tempRoot, 'file1.ts'), code1);
    fs.writeFileSync(path.join(tempRoot, 'file2.ts'), code2);
    fs.writeFileSync(path.join(tempRoot, 'file_complex.ts'), complexCode);
}

function runTests() {
    setup();

    const result1 = scanFile(path.join(tempRoot, 'file1.ts'));
    const result2 = scanFile(path.join(tempRoot, 'file2.ts'));
    const resultComplex = scanFile(path.join(tempRoot, 'file_complex.ts'));

    if (!result1 || !result2 || !resultComplex) {
        console.error('FAIL: scanFile returned null');
        process.exit(1);
    }

    console.log('Result 1:', result1.hash);
    console.log('Result 2:', result2.hash);

    if (result1.hash === result2.hash) {
        console.log('PASS: Hashes match for structural duplicates.');
    } else {
        console.error('FAIL: Hashes do not match.');
        process.exit(1);
    }

    // Verify project identification inside scanFile
    if (result1.project === 'temp_scanner' && result2.project === 'temp_scanner') {
        console.log('PASS: Project identified correctly.');
    } else {
        console.error(`FAIL: Project ID mismatch. Got ${result1.project}, expected temp_scanner`);
         process.exit(1);
    }

    // Verify complexity
    if (result1.complexity === 1) {
        console.log('PASS: Simple file has complexity 1.');
    } else {
        console.error(`FAIL: Simple file has complexity ${result1.complexity}, expected 1.`);
        process.exit(1);
    }

    // complexCode complexity calculation:
    // Base: 1
    // if: +1
    // ||: +1
    // for: +1
    // else if (if): +1
    // while: +1
    // ?: +1
    // Total: 7
    if (resultComplex.complexity === 7) {
        console.log('PASS: Complex file has complexity 7.');
    } else {
        console.error(`FAIL: Complex file has complexity ${resultComplex.complexity}, expected 7.`);
        process.exit(1);
    }

    // Cleanup
    fs.rmSync(tempRoot, { recursive: true, force: true });
}

runTests();
