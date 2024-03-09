const http = require('http');
const url = require("url");
const SQLHandler = require('./db');
const sqlHandler = new SQLHandler(process.env.POSTGRES_URL_CLIENT);

// Written with help from ChatGPT 3.5 to debug CORS issues
function handleOptions(req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
}

function reply(res, status, type, message) {
    res.writeHead(status, {
        'Content-Type': type,
        'Access-Control-Allow-Origin': '*'
    });
    res.end(message);
}

function handleGet(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/query') {
        const sqlQuery = parsedUrl.query.sql;
        if (sqlQuery) {
            console.log('Received query:', sqlQuery);
            sqlHandler.sendSQLQuery(sqlQuery)
                .then(result => {
                    if (result) {
                        reply(res, 200, 'application/json', JSON.stringify(result));
                    } else {
                        reply(res, 400, 'application/json', JSON.stringify(result));
                    }
                });
        } else {
            reply(res, 400, 'text/plain', '400 Bad Request');
        }
    } else {
        reply(res, 404, 'text/plain', '404 Not Found');
    }
}

function handlePost(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    req.on('end', () => {
        if (pathname === '/insert') {
            console.log('Received data:', body);
            const data = JSON.parse(body);
            sqlHandler.insertData(data)
                .then(result => {
                    if (result) {
                        reply(res, 200, 'application/json', JSON.stringify(result));
                    } else {
                        reply(res, 400, 'application/json', JSON.stringify(result));
                    }
                });
        } else if (pathname === '/query') {
            const query = JSON.parse(body).query;
            console.log('Received query:', query);
            sqlHandler.sendSQLQuery(query)
                .then(result => {
                    if (result) {
                        reply(res, 200, 'application/json', JSON.stringify(result));
                    } else {
                        reply(res, 400, 'application/json', JSON.stringify(result));
                    }
                });
        } else {
            reply(res, 404, 'text/plain', '404 Not Found');
        }
    });
}

async function handleRequest(req, res) {
    if (req.method === "OPTIONS") {
        handleOptions(req, res);
    } else if (req.method === "GET") {
        handleGet(req, res);
    } else if (req.method === "POST") {
        handlePost(req, res);
    } else {
        res.writeHead(404, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end('404 Not Found');
    }
}

const server = http.createServer(handleRequest);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
