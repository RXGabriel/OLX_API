const bcrypt = require("bcrypt");
const { validationResult, matchedData } = require("express-validator");
const User = require("../model/User");
const State = require("../model/State");
const mongoose = require("mongoose");
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
module.exports.signin = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.mapped() });
    return;
  }
  const data = matchedData(req);

  const user = await User.findOne({ email: data.email });
  if (!user) {
    res.json({ error: "Email e/ou senha errados" });
    return;
  }

  const match = await bcrypt.compare(data.password, user.passwordHash);
  if (!match) {
    res.json({ error: "Email e/ou senha errados" });
    return;
  }

  const payload = (Date.now() + Math.random()).toString();
  const token = await bcrypt.hash(payload, 10);
  user.token = token;
  await user.save();

  res.json({ token, email: data.email });
};
module.exports.signup = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.mapped() });
    return;
  }
  const data = matchedData(req);

  const user = await User.findOne({ email: data.email });
  if (user) {
    res.json({ error: { email: { msg: "Email ja existe" } } });
    return;
  }
  if (mongoose.Types.ObjectId.isValid(data.state)) {
    const stateItem = await State.findById(data.state);
    if (!stateItem) {
      res.json({ error: { state: { msg: "Estado inexistente" } } });
      return;
    }
  } else {
    res.json({ error: { state: { msg: "Campo de estado inválido	" } } });
    return;
  }
  const passwordHash = bcrypt.hashSync(data.password, 10);
  const payload = (Date.now() + Math.random()).toString();
  const token = await bcrypt.hash(payload, 10);

  const newuser = new User({
    name: data.name,
    email: data.email,
    passwordHash: passwordHash,
    token: token,
    state: data.state,
  });
  await newuser.save();

  res.json({ token });
};

// O terceiro é o UserController
module.exports.getStates = async function (req, res) {
  const states = await State.find();
  res.json({ states });
};
module.exports.getUserInfo = async function (req, res) {};
module.exports.editUserInfo = async function (req, res) {};
