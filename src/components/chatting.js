import express from "express";
import WAWeb from "whatsapp-web.js";
import request from "request";
import vuri from "valid-url";
import fs from "fs";
import { client } from "../api.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { MessageMedia, Location } = WAWeb;

const router = express.Router();

const mediadownloader = (url, tmpPath, callback) => {
  request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(tmpPath)).on("close", callback);
  });
};

router.post("/sendmessage/:phone", async (req, res) => {
  let phone = req.params.phone;
  let message = req.body.message;

  if (phone == undefined || message == undefined) {
    res.send({
      status: "error",
      message: "please enter valid phone and message",
    });
  } else {
    client.sendMessage(phone + "@c.us", message).then((response) => {
      if (response.id.fromMe) {
        res.send({
          status: "success",
          message: `Message successfully sent to ${phone}`,
        });
      }
    });
  }
});

router.post("/sendimage/:phone", async (req, res) => {
  var base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  let phone = req.params.phone;
  let image = req.body.image;
  let caption = req.body.caption;

  if (phone == undefined || image == undefined) {
    res.send({
      status: "error",
      message: "please enter valid phone and base64/url of image",
    });
  } else {
    if (base64regex.test(image)) {
      let media = new MessageMedia("image/png", image);
      client
        .sendMessage(`${phone}@c.us`, media, { caption: caption || "" })
        .then((response) => {
          if (response.id.fromMe) {
            res.send({
              status: "success",
              message: `MediaMessage successfully sent to ${phone}`,
            });
          }
        });
    } else if (vuri.isWebUri(image)) {
      if (!fs.existsSync(path.resolve(__dirname, "/temp"))) {
        fs.mkdirSync(path.resolve(__dirname, "/temp"));
      }

      var tmpPath = path.resolve(
        __dirname,
        "/temp/" + image.split("/").slice(-1)[0]
      );
      mediadownloader(image, tmpPath, () => {
        let media = MessageMedia.fromFilePath(tmpPath);

        client
          .sendMessage(`${phone}@c.us`, media, { caption: caption || "" })
          .then((response) => {
            if (response.id.fromMe) {
              res.send({
                status: "success",
                message: `MediaMessage successfully sent to ${phone}`,
              });
              fs.unlinkSync(tmpPath);
            }
          });
      });
    } else {
      res.send({
        status: "error",
        message: "Invalid URL/Base64 Encoded Media",
      });
    }
  }
});

router.post("/sendpdf/:phone", async (req, res) => {
  var base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  let phone = req.params.phone;
  let pdf = req.body.pdf;

  if (phone == undefined || pdf == undefined) {
    res.send({
      status: "error",
      message: "please enter valid phone and base64/url of pdf",
    });
  } else {
    if (base64regex.test(pdf)) {
      let media = new MessageMedia("application/pdf", pdf);
      client.sendMessage(`${phone}@c.us`, media).then((response) => {
        if (response.id.fromMe) {
          res.send({
            status: "success",
            message: `MediaMessage successfully sent to ${phone}`,
          });
        }
      });
    } else if (vuri.isWebUri(pdf)) {
      if (!fs.existsSync(path.resolve(__dirname, "/temp"))) {
        fs.mkdirSync(path.resolve(__dirname, "/temp"));
      }

      var tmpPath = path.resolve(
        __dirname,
        "/temp/" + pdf.split("/").slice(-1)[0]
      );
      mediadownloader(pdf, tmpPath, () => {
        let media = MessageMedia.fromFilePath(tmpPath);
        client.sendMessage(`${phone}@c.us`, media).then((response) => {
          if (response.id.fromMe) {
            res.send({
              status: "success",
              message: `MediaMessage successfully sent to ${phone}`,
            });
            fs.unlinkSync(tmpPath);
          }
        });
      });
    } else {
      res.send({
        status: "error",
        message: "Invalid URL/Base64 Encoded Media",
      });
    }
  }
});

router.post("/sendlocation/:phone", async (req, res) => {
  let phone = req.params.phone;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  let desc = req.body.description;

  if (phone == undefined || latitude == undefined || longitude == undefined) {
    res.send({
      status: "error",
      message: "please enter valid phone, latitude and longitude",
    });
  } else {
    let loc = new Location(latitude, longitude, desc || "");
    client.sendMessage(`${phone}@c.us`, loc).then((response) => {
      if (response.id.fromMe) {
        res.send({
          status: "success",
          message: `MediaMessage successfully sent to ${phone}`,
        });
      }
    });
  }
});

router.get("/getchatbyid/:phone/:limit", async (req, res) => {
  let phone = req.params.phone;
  let limit = req.params.limit || 5;
  if (phone == undefined) {
    res.send({ status: "error", message: "please enter valid phone number" });
  } else {
    client
      .getChatById(`${phone}@c.us`)
      .then(async (chat) => {

        const chatMessages = await chat.fetchMessages({limit});
        res.send({
          status: "success",
          message: {
            chat: chat,
            chatMessages 
          }
        });
      })
      .catch(() => {
        console.error("getchaterror");
        res.send({ status: "error", message: "getchaterror" });
      });
  }
});

router.get("/getchats", async (req, res) => {
  client
    .getChats()
    .then((chats) => {
      res.send({ status: "success", message: chats });
    })
    .catch((e) => {
      console.log(e);
      res.send({ status: "error", message: "getchatserror" });
    });
});

export { router };
