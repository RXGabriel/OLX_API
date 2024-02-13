const { checkSchema } = require("express-validator");

module.exports = {
  signup: checkSchema({
    name: {
      trim: true,
      isLength: {
        options: { min: 3 },
      },
      errorMessage: "Nome precisa ter pelo menos 3 caracteres.",
    },
    email: {
      isEmail: true,
      normalizeEmail: true,
      errorMessage: "E-mail inválido.",
    },
    password: {
      isLength: {
        options: { min: 4 },
      },
      errorMessage: "Senha inválida. Precisa ter pelo menos 4 caracteres.",
    },
    state: {
      notEmpty: true,
      errorMessage: "Selecione um estado",
    },
  }),
  signin: checkSchema({
    email: {
      isEmail: true,
      normalizeEmail: true,
      errorMessage: "E-mail inválido.",
    },
    password: {
      isLength: {
        options: { min: 4 },
      },
      errorMessage: "Senha inválida. Precisa ter pelo menos 4 caracteres.",
    },
  }),
};
