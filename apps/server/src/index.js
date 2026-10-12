import express from "express";
import { httpServerHandler } from "cloudflare:node";

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.json({ hello: "world" }));
app.post("/echo", (req, res) => res.json(req.body));

app.listen(3000); // port is only a label here
export default httpServerHandler({ port: 3000 });
