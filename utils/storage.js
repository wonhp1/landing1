import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function readData(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return filename.endsWith('.json') ? (filename === 'pages.json' ? {} : []) : null;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return filename.endsWith('.json') ? (filename === 'pages.json' ? {} : []) : null;
    }
}

export function writeData(filename, data) {
    try {
        const filePath = path.join(DATA_DIR, filename);

        // data 디렉토리가 없으면 생성
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
}
