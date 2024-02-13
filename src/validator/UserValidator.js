const { checkSchema } = require("express-validator");

module.exports = {
  edit: checkSchema({
    token: {
      notEmpty: true,
    },
    name: {
      optional: true,
      trim: true,
      isLength: {
        options: { min: 3 },
      },
      errorMessage: "Nome precisa ter pelo menos 3 caracteres.",
    },
    email: {
      optional: true,
      isEmail: true,
      normalizeEmail: true,
      errorMessage: "E-mail inválido.",
    },
    password: {
      optional: true,
      isLength: {
        options: { min: 4 },
      },
      errorMessage: "Senha inválida. Precisa ter pelo menos 4 caracteres.",
    },
    state: {
      optional: true,
      notEmpty: true,
      errorMessage: "Selecione um estado",
    },
  }),
};
