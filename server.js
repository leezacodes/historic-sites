/********************************************************************************
 * WEB322 – Assignment 06
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Aleeza Ahmad        Student ID: 152220236       Date: April 12th, 2025
 *
 * Published URL: https://historic-sites-gamma.vercel.app/
 *
 ********************************************************************************/
require("dotenv").config(); //for port number
const express = require("express");
const app = express();
const path = require("path");
const siteData = require("./modules/data-service");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpRQf",
    duration: 20 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/sites", async (req, res) => {
  try {
    let sites = [];
    if (req.query.region) {
      sites = await siteData.getSitesByRegion(req.query.region);
    } else if (req.query.provinceOrTerritory) {
      sites = await siteData.getSitesByProvinceOrTerritoryName(
        req.query.provinceOrTerritory
      );
    } else {
      // If no query parameter is provided, return all sites
      sites = await siteData.getAllSites();
    }
    res.render("sites", { sites });
  } catch (err) {
    res
      .status(404)
      .render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
      });
  }
});

app.get("/sites/:id", async (req, res) => {
  try {
    let site = await siteData.getSiteById(req.params.id);
    if (site) {
      res.render("site", { site });
    } else {
      res.status(404);
    }
  } catch (err) {
    res
      .status(404)
      .render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
      });
  }
});

app.use(express.urlencoded({ extended: true }));

// login details 
app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "" });
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: "",
  });
});

app.post("/register", (req, res) => {
  const userData = req.body;
  authData
    .registerUser(userData)
    .then((user) => {
      res.render("register", {
        errorMessage: "",
        successMessage: "User created",
        userName: "",
      });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        successMessage: "",
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  const userData = req.body; //getting user info
  //calling authentication function
  authData
    .checkUser(userData)
    .then((user) => {
      //authenticated user info from function
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      //homepage but logged in
      res.redirect("/sites");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: userData.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// update functions with ensure login function
app.get("/addSite", ensureLogin, (req, res) => {
  siteData
    .getAllProvincesAndTerritories()
    .then((provinces) => {
      res.render("addSite", { provincesAndTerritories: provinces });
    })
    .catch((err) => {
      res.status(404).render("404", { message: "Unable to find sites." });
      console.log(err);
    });
});

app.post("/addSite", ensureLogin, (req, res) => {
  const data = req.body;
  siteData
    .addSite(data)
    .then(() => {
      res.redirect("/sites");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err.errors[0].message}`,
      });
      console.log(err);
    });
});

app.get("/editSite/:id", ensureLogin, (req, res) => {
  const siteId = req.params.id;
  if (siteData) {
    siteData
      .getSiteById(siteId)
      .then((data) => {
        siteData.getAllProvincesAndTerritories().then((site) => {
          res.render("editSite", {
            provincesAndTerritories: site,
            sites: data,
          });
        });
      })
      .catch((err) => {
        res.status(404).render("404", { message: err });
        console.log(err);
      });
  }
});

app.post("/editSite", ensureLogin, (req, res) => {
  const siteId = req.body.id;
  const data = req.body;
  if (siteId) {
    siteData
      .editSite(siteId, data)
      .then(() => {
        res.redirect("/sites");
      })
      .catch((err) => {
        res.render("500", {
          message: `I'm sorry, but we have encountered the following error: ${err}`,
        });
      });
  }
});

app.use("/deleteSite/:id", ensureLogin, (req, res) => {
  const siteId = req.params.id;
  if (siteId) {
    siteData
      .deleteSite(siteId)
      .then(() => {
        res.redirect("/sites");
      })
      .catch((err) => {
        res.render("500", {
          message: `I'm sorry, but we have encountered the following error: ${err}`,
        });
      });
  }
});

app.use((req, res) => {
  res
    .status(404)
    .render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
});

siteData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });
