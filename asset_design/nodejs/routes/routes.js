// Import required modules
const express = require("express");

// Create a router
const router = express.Router();

const ai = require("./ai");
const authentication = require("./authentication");
const blog = require("./blog");
const chart = require("./chart");
const components = require("./components");
const cryptoCurrency = require("./cryptoCurrency");
const dashboard = require("./dashboard");
const forms = require("./forms");
const invoice = require("./invoice");
const rolesAndAccess = require("./rolesAndAccess");
const settings = require("./settings");
const table = require("./table");
const users = require("./users");

router.get("/", (req, res) => {
  res.render("index", { title: "Dashboard", subTitle: "AI" });
});

router.get("/index", (req, res) => {
  res.render("index", { title: "Dashboard", subTitle: "AI" });
});

router.get("/blankpage", (req, res) => {
  res.render("blankpage", { title: "Blank Page", subTitle: "Blank Page" });
});

router.get("/calendar", (req, res) => {
  res.render("calendar", { title: "Calendar", subTitle: "Components / Calendar" });
});

router.get("/chat", (req, res) => {
  res.render("chat", { title: "Chat", subTitle: "Chat" });
});

router.get("/chat-profile", (req, res) => {
  res.render("chatProfile", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/comingsoon", (req, res) => {
  res.render("comingsoon", { title: "Dashboard", subTitle: "subTitle", layout: "../views/layout/layout2" });
});

router.get("/email", (req, res) => {
  res.render("email", { title: "Email", subTitle: "Components / Email" });
});

router.get("/faqs", (req, res) => {
  res.render("faqs", { title: "Faq", subTitle: "Faq" });
});

router.get("/gallery", (req, res) => {
  res.render("gallery", { title: "Gallery", subTitle: "Gallery" });
});

router.get("/kanban", (req, res) => {
  res.render("kanban", { title: "Kanban", subTitle: "Kanban" });
});

router.get("/maintenance", (req, res) => {
  res.render("maintenance", { title: "Dashboard", subTitle: "subTitle", layout: "../views/layout/layout2" });
});

router.get("/not-found", (req, res) => {
  res.render("notFound", { title: "404", subTitle: "404" });
});

router.get("/pricing", (req, res) => {
  res.render("pricing", { title: "Pricing", subTitle: "Pricing" });
});

router.get("/stared", (req, res) => {
  res.render("stared", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/terms-and-conditions", (req, res) => {
  res.render("termsAndConditions", { title: "Terms & Conditions", subTitle: "Terms & Conditions" });
});

router.get("/testimonials", (req, res) => {
  res.render("testimonials", { title: "Testimonials", subTitle: "Testimonials" });
});

router.get("/view-details", (req, res) => {
  res.render("viewDetails", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/widgets", (req, res) => {
  res.render("widgets", { title: "Widgets", subTitle: "Widgets" });
});

router.use("/ai", ai);
router.use("/authentication", authentication);
router.use("/blog", blog);
router.use("/chart", chart);
router.use("/components", components);
router.use("/crypto-currency", cryptoCurrency);
router.use("/dashboard", dashboard);
router.use("/forms", forms);
router.use("/invoice", invoice);
router.use("/role-and-access", rolesAndAccess);
router.use("/settings", settings);
router.use("/table", table);
router.use("/users", users);

// Export the router
module.exports = function (app) {
  app.use("/", router);
};
