const express = require("express");
const router = express.Router();
const ApiController = require("./controller/apiController");
const Auth = require("./middleware/Auth");
const UserValidator = require("./validator/UserValidator");
const AuthValidator = require("./validator/AuthValidator");

router.get("/ping", ApiController.ping);

// Rotas relacionadas aos estados
router.get("/states", ApiController.getStates);

// Rotas relacionadas ao usuário
router.get("/user/profile", Auth.private, ApiController.getUserInfo);
router.put("/user/profile", UserValidator.edit, ApiController.editUserInfo);
router.post("/user/signin", AuthValidator.signin, ApiController.signin);
router.post("/user/signup", AuthValidator.signup, ApiController.signup);

// Rotas relacionadas aos anúncios
router.get("/categories", ApiController.getCategories);
router.post("/ad", ApiController.addAction);
router.get("/ad", ApiController.getList);
router.get("/ad/:id", ApiController.getItem);
router.put("/ad/:id", Auth.private, ApiController.editAdsAction);

module.exports = router;
