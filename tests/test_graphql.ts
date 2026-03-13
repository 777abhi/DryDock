import * as http from 'http';
import { spawn } from 'child_process';
import * as path from 'path';

function runGraphQLTests() {
    console.log("Testing GraphQL API mode...");

    // Start drydock with --api-only
    const drydockProcess = spawn('npx', ['ts-node', path.join(__dirname, '../src/drydock.ts'), '--api-only'], {
        env: { ...process.env, PORT: '0' } // Use dynamic port to avoid collision
    });

    let stdoutData = '';
    let portMatch: RegExpMatchArray | null = null;
    let testsCompleted = false;

    // Set a timeout to kill the process if something hangs
    const timeout = setTimeout(() => {
        if (!testsCompleted) {
            console.error("FAIL: GraphQL test timed out waiting for server to start.");
            drydockProcess.kill();
            process.exit(1);
        }
    }, 10000);

    drydockProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();

        // Wait for server to output port
        if (!portMatch) {
            // Regex to find 'launched at http://localhost:<port>'
            portMatch = stdoutData.match(/http:\/\/localhost:(\d+)/);
            if (portMatch) {
                const port = parseInt(portMatch[1], 10);
                console.log(`Server started on dynamic port ${port}. Running GraphQL assertions...`);
                runAssertions(port);
            }
        }
    });

    drydockProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    function runAssertions(port: number) {
        // Test 1: POST request to /api/graphql
        const postData = JSON.stringify({
            query: `
                query {
                    report {
                        cross_project_leakage {
                            lines
                            projects
                        }
                    }
                }
            `
        });

        const options = {
            hostname: 'localhost',
            port: port,
            path: '/api/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const responseBody = JSON.parse(data);
                    if (res.statusCode !== 200) {
                        throw new Error(`Expected status 200, got ${res.statusCode}. Body: ${data}`);
                    }
                    if (!responseBody.data || !responseBody.data.report || !Array.isArray(responseBody.data.report.cross_project_leakage)) {
                        throw new Error(`Invalid GraphQL response: ${data}`);
                    }
                    console.log("PASS: POST /api/graphql returned valid GraphQL response.");
                    finishTest(0);
                } catch (err: any) {
                    console.error(`FAIL: ${err.message}`);
                    finishTest(1);
                }
            });
        });

        req.on('error', (err) => {
            console.error(`FAIL: POST request error: ${err.message}`);
            finishTest(1);
        });

        req.write(postData);
        req.end();
    }

    function finishTest(code: number) {
        testsCompleted = true;
        clearTimeout(timeout);
        drydockProcess.kill();
        if (code === 0) {
            console.log("All GraphQL tests passed.");
        }
        process.exit(code);
    }
}

try {
    runGraphQLTests();
} catch (e) {
    console.error("FAIL: GraphQL tests threw unhandled exception", e);
    process.exit(1);
}
