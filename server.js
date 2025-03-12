/********************************************************************************
 * WEB322 – Assignment 04
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Aleeza Ahmad        Student ID: 152220236       Date: March 11th, 2025
 *
 * Published URL:
 *
 ********************************************************************************/
require("dotenv").config(); //for port number
const express = require("express");
const app = express();
const path = require("path");
const siteData = require("./modules/data-service");
const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

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
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
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
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
  }
});

app.use((req, res) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
});

siteData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log("Express http server listening on: " + HTTP_PORT)
    );
  })
  .catch((err) => {
    console.log("Error: ", err);
  });
