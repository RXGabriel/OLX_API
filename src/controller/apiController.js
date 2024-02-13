const State = require("../model/State");
const { validationResult, matchedData } = require("express-validator");
module.exports.ping = function (req, res) {
  res.json({ pong: true });
};

// O Primeiro é o AdsController
module.exports.getCategories = async function (req, res) {};
module.exports.addAction = async function (req, res) {};
module.exports.getList = async function (req, res) {};
module.exports.getItem = async function (req, res) {};
module.exports.editAdsAction = async function (req, res) {};

// O segundo é o AuthController
module.exports.signin = async function (req, res) {};
module.exports.signup = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.mapped() });
    return;
  }
  const data = matchedData(req);
  res.json({ tudoCerto: true, data: data });
};

// O terceiro é o UserController
module.exports.getStates = async function (req, res) {
  const states = await State.find();
  res.json({ states });
};
module.exports.getUserInfo = async function (req, res) {};
module.exports.editUserInfo = async function (req, res) {};
