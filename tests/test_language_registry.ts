import { LanguageRegistry } from '../src/language-registry';

function runTests() {
    console.log('Testing LanguageRegistry...');
    let passed = 0;
    const cases = 0;

    const registry = LanguageRegistry.getInstance();

    // Test default languages
    let format = registry.getFormat('.ts');
    if (format === 'typescript') {
        passed++;
    } else {
        console.error(`FAIL: Expected 'typescript' for .ts, got ${format}`);
    }

    format = registry.getFormat('.js');
    if (format === 'javascript') {
        passed++;
    } else {
        console.error(`FAIL: Expected 'javascript' for .js, got ${format}`);
    }

    // Test registering new language
    registry.registerExtension('.ex', 'elixir');
    format = registry.getFormat('.ex');
    if (format === 'elixir') {
        passed++;
    } else {
        console.error(`FAIL: Expected 'elixir' for .ex, got ${format}`);
    }

    // Test fallback
    format = registry.getFormat('.unknown');
    if (format === 'javascript') {
        passed++;
    } else {
        console.error(`FAIL: Expected 'javascript' for .unknown, got ${format}`);
    }

    if (passed === 4) {
        console.log('All LanguageRegistry tests passed.');
        process.exit(0);
    } else {
        console.error(`Failed ${4 - passed} LanguageRegistry tests.`);
        process.exit(1);
    }
}

runTests();
