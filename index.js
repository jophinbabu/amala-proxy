import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TARGET = "http://his.amalaims.org:9090";

// Forward ALL requests to your backend
app.use(async (req, res) => {
    try {
        const url = TARGET + req.originalUrl;

        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                ...req.headers,
                host: undefined,
            },
        });

        res.status(response.status).send(response.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Proxy error");
    }
});

export default app;
