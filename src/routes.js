import express from "express";
const router = express.Router();

const AuthController = require("./controller/AuthController");
const UsersController = require("./controller/UserController");
const AdsController = require("./controller/AdsController");

router.get("/ping", (req, res) => {
  res.json({ pong: true });
});

router.get("/states", UsersController.getStates);
router.get("/user/me", UsersController.info);
router.put("/user/me", UsersController.editAction);
router.post("/user/signin", AuthController.signin);
router.post("/user/signup", AuthController.signup);
router.get("/categories", AdsController.getCategories);
router.post("/ad/add", AdsController.addAction);
router.get("/ad/list", AdsController.getList);
router.get("/ad/item", AdsController.getItem);
router.post("/ad/:id", AdsController.editAction);

module.exports = router;
