const express = require("express");
const router = express.Router();

// import controller
const { requireSignin, adminMiddleware } = require("../controllers/auth");
const {
  read,
  contact,
  update,
  updateUserByPass,
} = require("../controllers/user");

// import validators
const {
  // userUpdateByIdValidator,
  // userUpdateByPassValidator,
  userUpdateValidator,
} = require("../validators/user");
const { runValidation } = require("../validators");

router.get("/user/:id", requireSignin, read);

// do not use validator here -- do not know which field -- initialEmail or updatedEail submitting
router.post("/user/pass-update", requireSignin, updateUserByPass);

// this is only used to update name  -- so validator is only name
router.put(
  "/user/update",
  requireSignin,
  userUpdateValidator,
  runValidation,
  update
);

// this api is use when user fills contact us form -- fullname, email, message
router.post("/user/contact", contact);

router.put("/admin/update", requireSignin, adminMiddleware, update);

module.exports = router;
