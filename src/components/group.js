import express from "express";
import WAWeb from "whatsapp-web.js";
import request from "request";
import vuri from "valid-url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { MessageMedia, Location } = WAWeb;

const router = express.Router();

const mediadownloader = (url, tempPath, callback) => {
  request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(tempPath)).on("close", callback);
  });
};

router.post("/sendmessage/:chatname", async (req, res) => {
  let chatname = req.params.chatname;
  let message = req.body.message;

  if (chatname == undefined || message == undefined) {
    res.send({
      status: "error",
      message: "please enter valid chatname and message",
    });
  } else {
    client.getChats().then((data) => {
      data.forEach((chat) => {
        if (chat.id.server === "g.us" && chat.name === chatname) {
          client.sendMessage(chat.id._serialized, message).then((response) => {
            if (response.id.fromMe) {
              res.send({
                status: "success",
                message: `Message successfully send to ${chatname}`,
              });
            }
          });
        }
      });
    });
  }
});

router.post("/sendimage/:chatname", async (req, res) => {
  var base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  let chatname = req.params.chatname;
  let image = req.body.image;
  let caption = req.body.caption;

  if (chatname == undefined || image == undefined) {
    res.send({
      status: "error",
      message: "please enter valid chatname and base64/url of image",
    });
  } else {
    if (base64regex.test(image)) {
      client.getChats().then((data) => {
        data.forEach((chat) => {
          if (chat.id.server === "g.us" && chat.name === chatname) {
            if (!fs.existsSync(path.resolve(__dirname, "/temp"))) {
              fs.mkdirSync(path.resolve(__dirname, "/temp"));
            }

            let media = new MessageMedia("image/png", image);
            client
              .sendMessage(chat.id._serialized, media, {
                caption: caption || "",
              })
              .then((response) => {
                if (response.id.fromMe) {
                  res.send({
                    status: "success",
                    message: `Message successfully send to ${chatname}`,
                  });
                }
              });
          }
        });
      });
    } else if (vuri.isWebUri(image)) {
      var tmpPath = path.resolve(
        __dirname,
        "/temp/" + image.split("/").slice(-1)[0]
      );
      client.getChats().then((data) => {
        data.forEach((chat) => {
          if (chat.id.server === "g.us" && chat.name === chatname) {
            mediadownloader(image, tmpPath, () => {
              let media = MessageMedia.fromFilePath(tmpPath);
              client
                .sendMessage(chat.id._serialized, media, {
                  caption: caption || "",
                })
                .then((response) => {
                  if (response.id.fromMe) {
                    res.send({
                      status: "success",
                      message: `Message successfully send to ${chatname}`,
                    });
                    fs.unlinkSync(tmpPath);
                  }
                });
            });
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

router.post("/sendpdf/:chatname", async (req, res) => {
  var base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  let chatname = req.params.chatname;
  let pdf = req.body.pdf;

  if (chatname == undefined || pdf == undefined) {
    res.send({
      status: "error",
      message: "please enter valid chatname and base64/url of pdf",
    });
  } else {
    if (base64regex.test(pdf)) {
      client.getChats().then((data) => {
        data.some((chat) => {
          if (chat.id.server === "g.us" && chat.name === chatname) {
            if (!fs.existsSync(path.resolve(__dirname, "/temp"))) {
              fs.mkdirSync(path.resolve(__dirname, "/temp"));
            }
            let media = new MessageMedia("application/pdf", pdf);
            client.sendMessage(chat.id._serialized, media).then((response) => {
              if (response.id.fromMe) {
                res.send({
                  status: "success",
                  message: `Message successfully send to ${chatname}`,
                });
              }
            });
            return true;
          }
        });
      });
    } else if (vuri.isWebUri(pdf)) {
      var tmpPath = path.resolve(
        __dirname,
        "/temp/" + image.split("/").slice(-1)[0]
      );
      client.getChats().then((data) => {
        data.some((chat) => {
          if (chat.id.server === "g.us" && chat.name === chatname) {
            mediadownloader(image, tmpPath, () => {
              let media = MessageMedia.fromFilePath(tmpPath);
              client
                .sendMessage(chat.id._serialized, media)
                .then((response) => {
                  if (response.id.fromMe) {
                    res.send({
                      status: "success",
                      message: `Message successfully send to ${chatname}`,
                    });
                    fs.unlinkSync(tmpPath);
                  }
                });
            });
            return true;
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

router.post("/sendlocation/:chatname", async (req, res) => {
  let chatname = req.params.chatname;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;
  let desc = req.body.description;

  if (
    chatname == undefined ||
    latitude == undefined ||
    longitude == undefined
  ) {
    res.send({
      status: "error",
      message: "please enter valid phone, latitude and longitude",
    });
  } else {
    client.getChats().then((data) => {
      data.some((chat) => {
        if (chat.id.server === "g.us" && chat.name === chatname) {
          let loc = new Location(latitude, longitude, desc || "");
          client.sendMessage(chat.id._serialized, loc).then((response) => {
            if (response.id.fromMe) {
              res.send({
                status: "success",
                message: `Message successfully send to ${chatname}`,
              });
            }
          });
          return true;
        }
      });
    });
  }
});

export { router };
