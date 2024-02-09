const express = require("express");
const router = express.Router();
const ApiController = require("./controller/apiController");
const Auth = require("./middleware/Auth");

router.get("/ping", ApiController.ping);

// Rotas relacionadas aos estados
router.get("/states", ApiController.getStates);

// Rotas relacionadas ao usuário
router.get("/user/profile", Auth.private, ApiController.getUserInfo);
router.put("/user/profile", Auth.private, ApiController.editUserInfo);
router.post("/user/signin", ApiController.signin);
router.post("/user/signup", ApiController.signup);

// Rotas relacionadas aos anúncios
router.get("/categories", ApiController.getCategories);
router.post("/ad", ApiController.addAction);
router.get("/ad", ApiController.getList);
router.get("/ad/:id", ApiController.getItem);
router.put("/ad/:id", Auth.private, ApiController.editAdsAction);

module.exports = router;
