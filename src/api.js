import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import axios from "axios";
import shelljs from "shelljs";
import "dotenv/config";
import config from "./config.js";
import { Client } from "whatsapp-web.js";
import { fileURLToPath } from "url";

import * as chatRoute from "./components/chatting.js";
import * as groupRoute from "./components/group.js";
import * as authRoute from "./components/auth.js";
import * as contactRoute from "./components/contact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SESSION_FILE_PATH =
  path.resolve(__dirname, `../${process.env.SESSION_FILE_PATH}`) ||
  "./session.json";

let sessionCfg;

if (fs.existsSync(SESSION_FILE_PATH)) {
  const { default: sessionCfg } = await import(
    (process.platform === "win32" ? "file://" : "") + SESSION_FILE_PATH,
    { assert: { type: "json" } }
  );
  console.log("sessionCfg:");
  console.log(sessionCfg);
}

process.title = "whatsapp-node-api";
export const client = new Client({
  authTimeoutMs: 900000,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--unhandled-rejections=strict",
    ],
  },
  session: sessionCfg,
});

let authed = false;

const app = express();

const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB
app.use(bodyParser.json({ limit: "50mb" }));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

client.on("qr", (qr) => {
  // if (!fs.existsSync(__dirname, `components/last.qr`)) {
  console.log("generating qr code..");
  fs.writeFileSync(path.resolve(__dirname, `components/last.qr`), qr);
  // }
});

client.on("authenticated", (session) => {
  console.log("AUTH!");
  sessionCfg = session;

  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
    if (err) {
      console.error(err);
    }
    authed = true;
  });

  try {
    fs.unlinkSync(__dirname, "components/last.qr");
  } catch (err) {}
});

client.on("auth_failure", () => {
  console.log("AUTH Failed !");
  sessionCfg = "";
  process.exit();
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (msg) => {
  if (config.webhook.enabled) {
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      console.log("media was downloaded!");
      // msg.attachmentData = attachmentData;
    }
    axios.post(config.webhook.path, { msg });
  }
});
client.initialize();

app.use(function (req, res, next) {
  console.log(req.method + " : " + req.path);
  next();
});

app.use("/api/auth", authRoute.router);
app.use("/api/chat", chatRoute.router);
app.use("/api/group", groupRoute.router);
app.use("/api/contact", authRoute.checkAuth, contactRoute.router);

app.use("/webhook/push", function (req, res, next) {
  console.log(req);
  console.log(process.env.GIT_WEBHOOK_SECRET);
  next();
});

app.listen(port, () => {
  console.log("Server Running Live on Port : " + port);
});
