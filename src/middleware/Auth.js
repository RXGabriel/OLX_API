const User = require("../model/User");

module.exports = {
  private: async (request, response, next) => {
    if (!request.query.token && !request.body.token) {
      response.json({ notallowed: true });
      return;
    }

    let token = "";
    if (request.query.token) {
      token = request.query.token;
    }
    if (request.body.token) {
      token = request.body.token;
    }

    if (token == "") {
      response.json({ notallowed: true });
      return;
    }

    const user = await User.findOne({ token });

    if (!user) {
      response.json({ notallowed: true });
      return;
    }

    next();
  },
};
