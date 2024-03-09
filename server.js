require('dotenv').config();
const http = require('http');
const url = require("url");
const SQLHandler = require('./db');
const sqlHandler = new SQLHandler(process.env.POSTGRES_URL_CLIENT);

function handleGet(req, res) {
    const query = url.parse(req.url, true).query;
    const sqlQuery = query.sql;
    if (sqlQuery) {
        console.log('Received query:', sqlQuery);
        sqlHandler.sendSQLQuery(sqlQuery)
            .then(result => {
                if (result) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(JSON.stringify(result));
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end(JSON.stringify(result));
                }
            });
    } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('400 Bad Request');
    }
}

function handlePost(req, res) {
    let query = "";
    req.on('data', chunk => {
        query += chunk.toString();
    });
    req.on('end', async () => {
        console.log('Received query:', query);
        const result = await sqlHandler.sendSQLQuery(query);
        if (result) {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end(JSON.stringify(result));
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end(JSON.stringify(result));
        }
    });
}

async function handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === "GET") {
        handleGet(req, res);
    } else if (req.method === "POST") {
        handlePost(req, res);
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('404 Not Found');
    }
}

const server = http.createServer(handleRequest);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
