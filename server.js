const http = require('http');
const url = require("url");
const SQLHandler = require('./db');
const { error } = require('console');
const { error_messages } = require('./errors');
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

function checkEmptyQuery(query, res) {
    if (query === '') {
        reply(res, 400, 'Query cannot be empty.');
        return true;
    }
    return false;
}

function reply(res, status, message) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    const reply = {
        status: status,
        message: message
    }
    res.end(JSON.stringify(reply));
}

function handleGet(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/query') {
        const sqlQuery = parsedUrl.query.sql;
        if (!checkEmptyQuery(sqlQuery, res)) {
            console.log('Received query:', sqlQuery);
            sqlHandler.sendSQLQuery(sqlQuery)
                .then(result => {
                    if (result.data) {
                        reply(res, 200, result.data.rows);
                    } else {
                        console.log('Error:', error);
                        reply(res, 400, error_messages[result.error.routine] || "Error executing query.");
                    }
                });
        }
    } else {
        reply(res, 404, '404 Not Found');
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
            const data = JSON.parse(body);
            console.log('Received data:', data);
            sqlHandler.insertData(data)
                .then(result => {
                    if (result.data) {
                        reply(res, 201, "Successfully inserted data.");
                    } else {
                        console.log('Error:', error);
                        reply(res, 400, error_messages[result.error.routine] || "Error inserting data.");
                    }
                });
        } else if (pathname === '/query') {
            const query = JSON.parse(body).query;
            if (!checkEmptyQuery(query, res)) {
                console.log('Received query:', query);
                sqlHandler.sendSQLQuery(query)
                    .then(result => {
                        if (result.data) {
                            reply(res, 201, "Successfully inserted data.");
                        } else {
                            console.log('Error:', error);
                            reply(res, 400, error_messages[result.error.routine] || "Error inserting data.");
                        }
                    });
            }   
        } else {
            reply(res, 404, '404 Not Found');
        }
    });
}

async function handleRequest(req, res) {
    await sqlHandler.createTable();
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
