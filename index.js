import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TARGET = "http://his.amalaims.org:9090";

// Health check route
app.get("/", (req, res) => {
    res.send("Amala Proxy is Running! 🚀 (Try /bldget/...)");
});

// Forward ALL requests to your backend
app.use(async (req, res) => {
    try {
        let target = TARGET;
        if (req.originalUrl.includes('/pp-pdf') || req.originalUrl.includes('/ppfile')) {
            target = "http://pp.amalaims.org:9191";
        }
        const url = target + req.originalUrl;
        console.log(`Forwarding to: ${url}`);

        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                ...req.headers,
                host: undefined,
            },
            // Prevent axios from throwing on 4xx/5xx errors
            validateStatus: () => true,
            responseType: 'arraybuffer', // Important for images/fonts
        });

        // Forward important headers (Content-Type, etc.)
        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        res.status(response.status).send(response.data);
    } catch (err) {
        console.error("Proxy connection failed:", err.message);
        res.status(500).send("Proxy error: Could not reach backend.");
    }
});

export default app;
