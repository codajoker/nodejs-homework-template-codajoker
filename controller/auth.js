const { User } = require("../service/shemas/user");

const { registerUser,  } = require("../service");
const sendEmail = require("../helpers/sendEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createError = require("createerror");
require("dotenv").config()
const { SECRET_KEY } = process.env

const registerController = async (req, res, next) => {
  const { email, password } = req.body;
  const newUser = await registerUser(email, password);
  const mail = {
    to: email,
    subject: "Verify your email",
    text: `Hello, ${email}!\n\nPlease verify your email by clicking the link below.\n\nhttp://localhost:5000/users/verify/${newUser.verificationToken}`,
    html: `Hello, ${email}!<br/><br/>Please verify your email by clicking the link below.<br/><br/><a href="http://localhost:5000/users/verify/${newUser.verificationToken}">http://localhost:5000/users/verify/${newUser.verificationToken}</a>`,
  };
  await sendEmail(mail);
  return res.status(201).json({
    status: "success",

    user: {
      email: email,
      avatarURL: newUser.avatarURL,
      subscription: "starter",
    },
  });
};
const verifyEmail = async (req, res, next) => {
  const { verificationToken } = req.params;
  const result = await User.findOne({ verificationToken });
  console.log(result);
  if (result) {
    await User.findByIdAndUpdate(result._id, { verify: true , verificationToken: null});
    await result.save();
    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Ваш email был подтвержден вы можете войти в систему",
    });
  }


}
const resendEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  const verificationToken = user.verificationToken;
  if (user.verify) {
    return res.status(400).json({
     
      message:  "Verification has already been passed",
    });
  }

  const confirmEmail = {
    to: email,
    subject: "Verify your email",
    text: `Hello, ${email}!\n\nPlease verify your email by clicking the link below.\n\nhttp://localhost:5000/users/verify/${verificationToken}`,
    html: `Hello, ${email}!<br/><br/>Please verify your email by clicking the link below.<br/><br/><a href="http://localhost:5000/users/verify/${verificationToken}">http://localhost:5000/users/verify/${verificationToken}</a>`,
  };

  await sendEmail(confirmEmail);

  res.json({
    message: "Verification email sent",
  });
};
const loginController = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const hashPassword = bcrypt.compareSync(password, user.password);
  console.log(user.verify);
  if (!user || !user.verify|| !hashPassword) {
    return res.status(401).json({
      status: "Error",

      message: "Email or password  is wrong or not verify email",
    });
  }
  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

  await User.findByIdAndUpdate(user._id, { token });
  res.status(200).json({
    status: "success",

    data: {
      token: token,
      email: email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    },
  });
};
const getCurrent = async (req, res, next) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
};
const logOutController = async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate({ _id }, { token: null });

  res.status(204).json();
};
const subscriptionConroller = async (req, res, next) => {
  const { _id } = req.user;
  const body = req.body;
  const result = await User.findByIdAndUpdate({ _id }, body, { new: true });
  if (result) {
    res.status(200).json({
      status: "success",
      code: 200,
      message: `Ваш профиль был обновлен до статуса подписки ${result.subscription}`,
    });
  }
};

module.exports = {
  registerController,
  loginController,
  getCurrent,
  logOutController,verifyEmail,subscriptionConroller,resendEmail
};
