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
  await tempImage
    .cover(500, 500)
    .quality(80)
    .writeAsync(`./public/media/${newName}`);
  return newName;
};

module.exports.ping = function (req, res) {
  res.json({ pong: true });
};

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
  let { title, price, priceneg, desc, cat, token } = req.body;
  const user = await User.findOne({ token }).exec();

  if (!title || !cat) {
    res.json({ error: "Titulo e/ou categoria não foram preenchidos" });
    return;
  }

  if (cat.length < 12) {
    res.json({ error: "ID de categoria inválido" });
    return;
  }
  const category = await Category.findById(cat);
  if (!category) {
    res.json({ error: "Categoria inexistente" });
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
  newAd.category = cat;
  newAd.price = price;
  newAd.priceNegotiable = priceneg == "true" ? true : false;
  newAd.description = desc;
  newAd.views = 0;

  if (req.files && req.files.img) {
    if (req.files.img.length == undefined) {
      if (
        ["image/jpeg", "image/jpg", "image/png"].includes(
          req.files.img.mimetype
        )
      ) {
        let url = await addImage(req.files.img.data);
        newAd.images.push({
          url,
          default: false,
        });
      }
    } else {
      for (let i = 0; i < req.files.img.length; i++) {
        if (
          ["image/jpeg", "image/jpg", "image/png"].includes(
            req.files.img[i].mimetype
          )
        ) {
          let url = await addImage(req.files.img[i].data);
          newAd.images.push({
            url,
            default: false,
          });
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

module.exports.getList = async function (req, res) {
  let { sort = "asc", offset = 0, limit = 8, q, cat, state } = req.query;
  let filters = { status: true };
  let total = 0;

  if (q) {
    filters.title = { $regex: q, $options: "i" };
  }

  if (cat) {
    const c = await Category.findOne({ slug: cat }).exec();
    if (c) {
      filters.category = c._id.toString();
    }
  }

  if (state) {
    const s = await State.findOne({ name: state.toUpperCase() }).exec();
    if (s) {
      filters.state = s._id.toString();
    }
  }

  const adsTotal = await Ad.find(filters).exec();
  total = adsTotal.length;
  const adsData = await Ad.find(filters)
    .sort({ dateCreated: sort == "desc" ? -1 : 1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .exec();

  let ads = [];
  for (let i in adsData) {
    let image;
    let defaultImg = adsData[i].images.find((e) => e.default);
    if (defaultImg) {
      image = `${process.env.BASE}/media/${defaultImg.url}`;
    } else {
      image = `${process.env.BASE}/media/default.jpg`;
    }
    ads.push({
      id: adsData[i]._id,
      title: adsData[i].title,
      price: adsData[i].price,
      priceNegotiable: adsData[i].priceNegotiable,
      image,
    });
  }
  res.json({ ads, total });
};

module.exports.getItem = async function (req, res) {
  let { id, other = null } = req.query;

  if (!id) {
    res.json({ error: "Sem produto" });
    return;
  }

  if (id.length < 12) {
    res.json({ error: "ID inválido" });
    return;
  }

  const ad = await Ad.findById(id);
  if (!ad) {
    res.json({ error: "Produto inexistente" });
    return;
  }

  ad.views++;
  await ad.save();

  let images = [];
  for (let i in ad.images) {
    images.push(`${process.env.BASE}/media/${ad.images[i].url}`);
  }

  let category = await Category.findById(ad.category).exec();
  let userInfo = await User.findById(ad.idUser).exec();
  let stateInfo = await State.findById(ad.state).exec();

  let others = [];
  if (other) {
    const otherData = await Ad.find({ status: true, idUser: ad.idUser }).exec();

    for (let i in otherData) {
      if (otherData[i]._id.toString() != ad._id.toString()) {
        let image = `${process.env.BASE}/media/default.jpg`;

        let defaultImg = otherData[i].images.find((e) => e.default);
        if (defaultImg) {
          image = `${process.env.BASE}/media/${defaultImg.url}`;
        }

        others.push({
          id: otherData[i]._id,
          title: otherData[i].title,
          price: otherData[i].price,
          priceNegotiable: otherData[i].priceNegotiable,
          image,
        });
      }
    }
  }

  res.json({
    id: ad._id,
    title: ad.title,
    price: ad.price,
    priceNegotiable: ad.priceNegotiable,
    description: ad.description,
    dateCreated: ad.dateCreated,
    views: ad.views,
    images,
    category,
    userInfo: {
      name: userInfo.name,
      email: userInfo.email,
    },
    stateName: stateInfo.name,
    others,
  });
};

module.exports.editAdsAction = async function (req, res) {
  let { id } = req.params;
  let { title, status, price, priceneg, desc, cat, images, token } = req.body;

  if (id.length < 12) {
    res.json({ error: "ID inválido" });
    return;
  }

  const ad = await Ad.findById(id).exec();
  if (!ad) {
    res.json({ error: "Anúncio inexistente" });
    return;
  }

  const user = await User.findOne({ token }).exec();
  if (user._id.toString() !== ad.idUser) {
    res.json({ error: "Este anúncio não é seu" });
    return;
  }

  let updates = {};

  if (title) {
    updates.title = title;
  }
  if (price) {
    price = price.replace(".", "").replace(",", ".").replace("R$ ", "");
    price = parseFloat(price);
    updates.price = price;
  }
  if (priceneg) {
    updates.priceNegotiable = priceneg;
  }
  if (status) {
    updates.status = status;
  }
  if (desc) {
    updates.description = desc;
  }
  if (cat) {
    const category = await Category.findOne({ slug: cat }).exec();
    if (!category) {
      res.json({ error: "Categoria inexistente" });
      return;
    }
    updates.category = category._id.toString();
  }

  if (images) {
    updates.images = images;
  }

  await Ad.findByIdAndUpdate(id, { $set: updates });

  if (req.files && req.files.img) {
    const adI = await Ad.findById(id);

    if (req.files.img.length == undefined) {
      if (
        ["image/jpeg", "image/jpg", "image/png"].includes(
          req.files.img.mimetype
        )
      ) {
        let url = await addImage(req.files.img.data);
        adI.images.push({
          url,
          default: false,
        });
      }
    } else {
      for (let i = 0; i < req.files.img.length; i++) {
        if (
          ["image/jpeg", "image/jpg", "image/png"].includes(
            req.files.img[i].mimetype
          )
        ) {
          let url = await addImage(req.files.img[i].data);
          adI.images.push({
            url,
            default: false,
          });
        }
      }
    }

    adI.images = [...adI.images];
    await adI.save();
  }

  res.json({ error: "" });
};

module.exports.signin = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ error: errors.mapped() });
    return;
  }
  const data = matchedData(req);

  const user = await User.findOne({ email: data.email });
  if (!user) {
    res.json({ error: "E-mail e/ou senha errados!" });
    return;
  }

  const match = await bcrypt.compare(data.password, user.passwordHash);
  if (!match) {
    res.json({ error: "E-mail e/ou senha errados!" });
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
    res.json({ error: errors.mapped() });
    return;
  }
  const data = matchedData(req);
  const user = await User.findOne({
    email: data.email,
  });
  if (user) {
    res.json({
      error: { email: { msg: "E-mail já existe!" } },
    });
    return;
  }
  if (mongoose.Types.ObjectId.isValid(data.state)) {
    const stateItem = await State.findById(data.state);
    if (!stateItem) {
      res.json({
        error: { state: { msg: "Estado não existe" } },
      });
      return;
    }
  } else {
    res.json({
      error: { state: { msg: "Código de estado inválido" } },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const payload = (Date.now() + Math.random()).toString();
  const token = await bcrypt.hash(payload, 10);

  const newUser = new User({
    name: data.name,
    email: data.email,
    passwordHash,
    token,
    state: data.state,
  });
  await newUser.save();

  res.json({ token });
};

module.exports.getStates = async function (req, res) {
  let states = await State.find();
  res.json({ states });
};

module.exports.getUserInfo = async function (req, res) {
  let token = req.query.token;

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
    res.json({ error: errors.mapped() });
    return;
  }
  const data = matchedData(req);
  let updates = {};
  if (data.name) {
    updates.name = data.name;
  }

  if (data.email) {
    const emailCheck = await User.findOne({ email: data.email });
    if (emailCheck) {
      res.json({ error: "E-mail já existente!" });
      return;
    }
    updates.email = data.email;
  }

  if (data.state) {
    if (mongoose.Types.ObjectId.isValid(data.state)) {
      const stateCheck = await State.findById(data.state);
      if (!stateCheck) {
        res.json({ error: { state: { msg: "Estado não existe" } } });
        return;
      }
      updates.state = data.state;
    } else {
      res.json({ error: { state: { msg: "Código de estado inválido" } } });
      return;
    }
  }

  if (data.password) {
    updates.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await User.findOneAndUpdate({ token: data.token }, { $set: updates });

  res.json({});
};
