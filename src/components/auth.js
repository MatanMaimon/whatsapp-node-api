import { exec } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { client } from "../api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

const logout = async () => {
  try {
    // fs.existsSync(SESSION_FILE_PATH) && fs.unlinkSync(SESSION_FILE_PATH);
    exec("pm2 reload all");
    // const clientState = await client?.getState();
    // clientState && client?.logout();
  } catch (e) {
    console.error(e);
  }
};

export const checkAuth = async (req, res, next) => {
  try {
    const clientState = await client.getState();
    console.log(clientState);
    if (clientState) {
      res.status(200);
      res.json({
        message: clientState,
      });
      next();
    } else {
      res.status(200);
      res.json({
        message: "DISCONNECTED",
      });
      try {
        logout();
      } catch (err) {
        console.log(err);
      }
      next();
    }
  } catch (err) {
    if (err) {
      res.status(400);
      res.json({
        message: "DISCONNECTED",
      });
      try {
        logout();
      } catch (err) {
        console.log(err);
      }
      res.end();
    }
  }
};

router.get("/checkauth", checkAuth);

router.get("/getqr", async (req, res) => {
  client
    .getState()
    .then((data) => {
      if (data) {
        res.write("<html><body><h2>Already Authenticated</h2></body></html>");
        res.end();
      } else sendQr(res);
    })
    .catch(() => sendQr(res));
});

function sendQr(res) {
  fs.readFile(__dirname + "/last.qr", (err, last_qr) => {
    if (!err && last_qr) {
      res.status(200);
      res.json({
        last_qr: last_qr.toString(),
      });
      // res.write(page);
      res.end();
    }
  });
}

// router.get("/getqr2", (req, res) => {
//   var qrjs = fs.readFileSync(__dirname + "/qrcode.js");

//   fs.readFile(__dirname + "/last.qr", (err, last_qr) => {
//     fs.readFile(SESSION_FILE_PATH, (serr, sessiondata) => {
//       console.log(err, sessiondata);
//       if (err && sessiondata) {
//         res.status(200);
//         res.json({
//           message: "auth already",
//         });
//         res.end();
//       } else if (!err && serr) {
//         var page = `
//                     <html>
//                         <body>
//                             <script>${qrjs}</script>
//                             <div id="qrcode"></div>
//                             <script type="text/javascript">
//                                 new QRCode(document.getElementById("qrcode"), "${last_qr}");
//                             </script>
//                         </body>
//                     </html>
//                 `;
//         // res.write(page);
//         // res.end();

//         res.status(200);
//         res.json({
//           last_qr: last_qr.toString(),
//         });
//         res.end();
//       } else {
//         res.status(200);
//         res.json({
//           message: "auth already",
//         });
//         res.end();
//       }
//     });
//   });
// });

router.get("/logout", (req, res, next) => {
  logout();

  res.status(200);
  res.json({
    message: "disconnected",
  });
  next();
});

export { router };
