const express = require('express');
const fs = require('fs');
const app = express();

// log.csv is git-ignored, so a fresh deploy has to create it with its header row.
if (!fs.existsSync('log.csv')) {
    fs.writeFileSync('log.csv', 'Agent,Time,Method,Resource,Version,Status\n');
}


app.use((req, res, next) => {
    const agent = req.get('user-agent').replaceAll(',', ':');
    const method = req.method;
    const resource = req.path;
    const version = `HTTP/${req.httpVersion}`;
    const time = new Date().toISOString();

    res.on('finish', () => {
        const line = `${agent},${time},${method},${resource},${version},${res.statusCode}\n`;
        console.log(line);
        fs.appendFile('log.csv',line, (err => {
            if (err) console.error(err);
        }));
    });

    next();
});

app.get('/', (req, res) => {
    res.send('ok');

});

app.get('/logs', (req, res) => {
    fs.readFile('log.csv', 'utf8', (err,data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Unable to read logs'});
        }

        const lines = data.split('\n');
        const headerKeys = lines[0].split(',');
        const dataLines = lines.slice(1).filter((line) => line.length > 0);
        const logs = dataLines.map((line) => {
            const values = line.split(',');
            return headerKeys.reduce((acc, key, i) => {
                acc[key] = values[i];
                return acc;
            }, {});
        });
        res.json(logs);
        
    });

});

module.exports = app;
