const { check } = require("express-validator");

exports.userUpdateValidator = [
  check("name").not().isEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Must be a valid email address"),
];

// exports.userUpdateByPassValidator = [
//   // check("name").isEmpty().withMessage("Name is required"),
//   check("email").isEmail().withMessage("Must be a valid email address"),
// ];

// exports.userUpdateByIdValidator = [
//   check("name").isEmpty().withMessage("Name is required"),
//   check("email").isEmail().withMessage("Must be a valid email address"),
// ];
