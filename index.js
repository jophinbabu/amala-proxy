import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
// ------------------------------------------------------------------
// CRITICAL: NO BODY PARSERS (express.json/urlencoded)
// We must stream the raw request for multipart/form-data to work.
// ------------------------------------------------------------------

const TARGET = "http://his.amalaims.org:9090";
const SECONDARY_TARGET = "http://pp.amalaims.org:9191";

// Health check route
app.get("/", (req, res) => {
    res.send("Amala Proxy is Running! 🚀 (Streaming Mode)");
});

// Forward ALL requests
app.use((req, res) => {
    let target = TARGET;
    if (req.originalUrl.includes('/pp-pdf') || req.originalUrl.includes('/ppfile')) {
        target = SECONDARY_TARGET;
    }

    const url = target + req.originalUrl;
    console.log(`Forwarding to: ${url} [${req.method}]`);

    // Stream the request to the target
    const proxyReq = axios({
        method: req.method,
        url: url,
        data: req, // PIPE the raw request stream
        responseType: 'stream', // GET response as a stream
        validateStatus: () => true, // Pass through all status codes
        headers: {
            ...req.headers,
            host: undefined, // Let Axios set the correct host
        },
    });

    proxyReq
        .then(response => {
            // Forward status and headers
            res.status(response.status);
            Object.keys(response.headers).forEach(key => {
                res.setHeader(key, response.headers[key]);
            });

            // Pipe the response stream back to the client
            response.data.pipe(res);
        })
        .catch(err => {
            console.error("Proxy Error:", err.message);
            if (!res.headersSent) {
                res.status(502).send(`Proxy Error: ${err.message}`);
            }
        });
});

export default app;
