import { parentPort, workerData } from 'worker_threads';
import { scanFile } from './scanner';

if (parentPort && workerData) {
    const { files } = workerData;

    for (const file of files) {
        try {
            const result = scanFile(file);
            parentPort.postMessage({ file, result });
        } catch (error: any) {
            parentPort.postMessage({ file, error: error.message || String(error) });
        }
    }
}
