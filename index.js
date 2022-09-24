const dotenv = require('dotenv');
const express = require("express");
const bodyParser = require('body-parser');
const passwordHash = require('password-hash');
var Airtable = require('airtable');

dotenv.config();
var base = new Airtable({ apiKey: process.env.API_AIRTABLE }).base('appzeUDpZOqRjLPaJ');
const { transporter } = require("./utils/constants");
const { generateHTML, sleep } = require("./utils/functions");
const port = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const path = require("path");
app.use(express.static(path.resolve(__dirname, "build")))

app.get("/", (req, res) => {
  res.send(path.resolve(__dirname, "build", "index.html"))
})


app.get("/products", async (req, res) => {
  const { search, minPrice, maxPrice } = req.query;
  const data = []
  base('Furniture').select({
    // maxRecords: 1,
    // view: "Main View",
  }).eachPage(function page(records, fetchNextPage) {
    records.forEach(function (record) {
      if (search) {
        if (search.length) {
          if (record.fields.Name.toLowerCase().startsWith(search.toLowerCase())) {
            data.push(record.fields);
          }
        } else {
          data.push(record.fields);
        }
      }
      if (!search && !minPrice && !maxPrice) {
        data.push(record.fields);
      }
    });

    fetchNextPage();

  }, (err) => {
    if (err) { console.error(err); return; }
    data.sort((a, b) => b["Units In Store"] - a["Units In Store"]);
    res.send(data);
  });

})


app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(req.body)
  // base('Users').select({ filterByFormula: `AND({username} = '${username}', {Password} = '${password}')` }).eachPage(function page(records) {
  base('Users').select({ filterByFormula: `({username} = '${username}')` }).eachPage(function page(records) {
    if (records.length) {
      if (passwordHash.verify(password, records[0]._rawJson.fields.Password)) {
        res.send({ error: false, msg: "User logged successfully", email: records[0]._rawJson.fields.email })
      } else {
        res.send({ error: true, msg: "Username or password wrong" })
      }
    } else {
      res.send({ error: true, msg: "Username or password wrong" })
    }
    // console.log(records[0]._rawJson.fields.email)
  }, (err) => {
    if (err) { console.error(err); res.send({ error: true, msg: err }); return; }
  });

})

app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, username } = req.body;
  await base('Users').select({ filterByFormula: `OR({email} = '${email}', {username} = '${username}')` }).eachPage(function page(records) {
    if (records.length) {
      console.log("Existe record: ", records)
      if (records[0]._rawJson.fields.email === email) res.send({ error: true, msg: "Email already exists" })
      if (records[0]._rawJson.fields.username === username) res.send({ error: true, msg: "Username already exists" })
    } else {
      base('Users').create([
        {
          "fields": {
            "Password": password,
            "First Name": firstName,
            "Last Name": lastName,
            "email": email,
            "username": username
          }
        },
      ], (err, records) => {
        if (err) {
          console.error(err);
          res.send({ error: true, msg: err });
          return;
        }
        res.send({ error: false, msg: "User registred" });
      });
    }
  }, (err) => {
    if (err) { console.error(err); res.send({ error: true, msg: err }); return; }
  });

})

app.post("/email", (req, res) => {
  const { email, product, } = req.body;
  // let emails = [email, "techpirates@resonance.nyc"];
  let emails = [email];
  const promise = new Promise((resolve, reject) => {
    let currentEmail = 0;
    for (let i = 0; i < emails.length; i++) {
      let mailOptions = {
        from: process.env.ownEmail,
        to: emails[i],
        subject: `${product.Name}`,
        html: generateHTML(product)
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          reject({ error: true, msg: "An error has ocurred" });
        } else {
          console.log('Email sent: ' + info.response);
          currentEmail++;
          if (currentEmail === emails.length) {
            resolve({ error: false, msg: "Email sent" });
          }
          sleep(1000);
        }
      });
    }

  })
  promise
    .then(result => {
      res.send(result);
      console.log("Resultado: ", result)
    })
    .catch(error => res.send(error));
})

app.listen(port, () => console.log("Listening on port ", port));

