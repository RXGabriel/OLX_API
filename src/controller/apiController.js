const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const jimp = require("jimp");
const { validationResult, matchedData } = require("express-validator");
const User = require("../model/User");
const Category = require("../model/Category");
const Ad = require("../model/Ad");
const State = require("../model/State");
const mongoose = require("mongoose");

const addImage = async (buffer) => {
  let newName = `${uuid()}.jpg`;
  let tempImage = await jimp.read(buffer);
  tempImage.cover(500, 500).quality(80).write(`./public/media/${newName}`);
  return newName;
};
module.exports.ping = function (req, res) {
  res.json({ pong: true });
};

// O Primeiro é o AdsController
module.exports.getCategories = async function (req, res) {
  const cats = await Category.find();
  let categories = [];

  for (let i in cats) {
    categories.push({
      ...cats[i]._doc,
      img: `${process.env.BASE}/assets/images/${cats[i].slug}.png`,
    });
  }

  res.json({ categories });
};
module.exports.addAction = async function (req, res) {
  let { title, price, priceNegotiable, description, category, token } =
    req.body;
  const user = await User.findOne({ token: token }).exec();

  if (!title || !category) {
    res.json({ error: "Título e/ou categoria não informados" });
    return;
  }
  if (price) {
    price = price.replace(".", "").replace(",", ".").replace("R$ ", "");
    price = parseFloat(price);
  } else {
    price = 0;
  }

  const newAd = new Ad();
  newAd.status = true;
  newAd.idUser = user._id;
  newAd.state = user.state;
  newAd.dateCreated = new Date();
  newAd.title = title;
  newAd.category = category;
  newAd.price = price;
  newAd.priceNegotiable = priceNegotiable == "true" ? true : false;
  newAd.description = description;
  newAd.views = 0;

  if (req.files && req.files.image) {
    if (req.files.image.length == undefined) {
      if (
        ["image/jpeg", "image/jpg", "image/png"].includes(
          req.files.image.mimetype
        )
      ) {
        let url = await addImage(req.files.image.data);
        newAd.images.push({ url: url, default: false });
      }
    } else {
      for (let i = 0; i < req.files.image.length; i++) {
        if (
          ["image/jpeg", "image/jpg", "image/png"].includes(
            req.files.image[i].mimetype
          )
        ) {
          let url = await addImage(req.files.image[i].data);
          newAd.images.push({ url: url, default: false });
        }
      }
    }
  }
  if (newAd.images.length > 0) {
    newAd.images[0].default = true;
  }

  const info = await newAd.save();
  res.json({ id: info._id });
};

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
module.exports.getUserInfo = async function (req, res) {
  let { token } = req.query;
  const user = await User.findOne({ token });
  const state = await State.findById(user.state);
  const ads = await Ad.find({ idUser: user._id.toString() });

  let adList = [];
  for (let i in ads) {
    const cat = await Category.findById(ads[i].category);
    adList.push({ ...ads[i], category: cat.slug });
  }

  res.json({
    name: user.name,
    email: user.email,
    state: state.name,
    ads: adList,
  });
};
module.exports.editUserInfo = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.mapped() });
    return;
  }
  const data = matchedData(req);
  let update = {};

  if (data.name) {
    update.name = data.name;
  }

  if (data.email) {
    const emailCheck = await User.findOne({ email: data.email });
    if (emailCheck) {
      res.json({ error: "Email já existe" });
      return;
    }
    update.email = data.email;
  }

  if (data.state) {
    if (mongoose.Types.ObjectId.isValid(data.state)) {
      const stateCheck = await State.findById(data.state);
      if (!stateCheck) {
        res.json({ error: "Estado inexistente" });
        return;
      }
      update.state = data.state;
    } else {
      res.json({ error: "Campo de estado inválido" });
      return;
    }
  }
  if (data.password) {
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await User.findOneAndUpdate({ token: data.token }, { $set: update });
  res.json({});
};
