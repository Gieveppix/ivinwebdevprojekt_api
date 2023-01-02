const express = require("express");
const knex = require("knex");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const nodemailer = require('nodemailer');

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "pass",
    database: "postgres",
  },
});

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());


app.get("/ping", async (req, res) => {
    const pong = "pong"
    res.send(pong)
    }
)

//
// LOGIN
//

app.post("/login", (req, res) => {
    db.select("email", "password")
      .from("users")
      .where("email", "=", req.body.email)
      .then(async (data) => {
        const isValid = await bcrypt.compare(req.body.password, data[0].password);
  
        if (isValid) {
          return db
            .select("user_id", "name", "email", "joined")
            .from("users")
            .where("email", "=", req.body.email)
            .then((user) => {
              res.json(user[0]);
            })
            .catch((err) => res.status(400).json("Unable to get user"));
        } else {
          res.status(400).json("");
        }
      })
      .catch((err) => res.status(400).json(""));
  });
  
  //
  // REGISTER + VALIDATE
  //
  
  app.post(
    "/register",
    [
      check("email", "Your email is not valid")
        .not()
        .isEmpty()
        .isEmail()
        .normalizeEmail(),
      check("password", "Your password must be at least 5 characters")
        .not()
        .isEmpty()
        .isLength({ min: 5 }),
    ],
    async (req, res) => {
      const saltRounds = 10;
  
      const { email, name, password } = req.body;
  
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array());
      } else {
        const hash = await bcrypt.hash(password, saltRounds);
        await db("users")
          .insert({
            email: email,
            name: name,
            password: hash,
          })
          .then(res.status(200).json("ok"))
          .catch((err) => res.status(400).json("Unable to register"));
      }
    }
  );

  //
  // SEND MAIL
  //
  
  app.post("/sendMail", (req, res) => {
    const { to } = req.body;

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: "ivawebprojekt@outlook.com",
        pass: "123456789!@#"
      }
    });

    const options = {
      from: "ivawebprojekt@outlook.com",
      to: to,
      subject: `TestProba`,
      html: `Some random text, wateva i dont care. HERE CHAIR! <br><img src="cid:unique@kreata.ee"/>`,
      attachments: {
        filename: "chair.png",
        path: __dirname + `/assets/chair.png`,
        cid: 'unique@kreata.ee'
      }
    }
    transporter.sendMail(options, function (err, info) {
      if(err) {
        console.log(err);
        res.status(400).json("Unable to send email")
        return;
      }
      console.log(info.response)
      res.status(200).json("ok")
    })
  })

  app.listen(3000, () => {
    console.log("App is up on port " + PORT);
  });