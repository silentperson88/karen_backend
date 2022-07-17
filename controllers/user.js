const User = require("../models/user");
const jwt = require("jsonwebtoken");

// sendgrid
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

// and send email token for update email by pass and add token link db
const changeEmail = (newEmail, user) => {
  const token = jwt.sign(
    { _id: user._id, name: user.name, email: newEmail },
    process.env.JWT_RESET_EMAIL,
    { expiresIn: "10m" }
  );

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: newEmail,
    subject: `Email Reset link`,
    html: `
              <h1>Please use the following link to reset your email</h1>
              <p>${process.env.CLIENT_URL}/auth/email/reset/${token}</p>
              <hr />
              <p>This email may contain sensetive information</p>
              <p>${process.env.CLIENT_URL}</p>
          `,
  };

  return { token, emailData };
};

exports.updateUserByPass = (req, res) => {
  const { confirmPassword, updatedEmail, updatedName, updatedPassword } =
    req.body;
  // // check if user exist
  // password

  let _id = req.user._id;
  User.findOne({ _id }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup",
      });
    }
    // authenticate
    if (!user.authenticate(confirmPassword)) {
      return res.status(400).json({
        error: "Email and password do not match",
      });
    }

    // if name update add to user object
    if (updatedName && updatedName.length > 0) user.name = updatedName;

    // if password updated add to user object
    if (updatedPassword && updatedPassword.length > 0)
      user.password = updatedPassword;

    // if email update ,
    if (updatedEmail && updatedEmail.length > 0) {
      // if not a proper email return
      if (!validateEmail(updatedEmail)) {
        return res.status(400).json({
          error: "Valid email requried",
        });
      } else {
        // continue if email ok
        let { token, emailData } = changeEmail(updatedEmail, user);
        user.updateOne({ resetEmailLink: token }, (err, success) => {
          if (err) {
            //console.log('RESET PASSWORD LINK ERROR', err);
            return res.status(400).json({
              error:
                "Database connection error on user password forgot request",
            });
          } else {
            return sgMail
              .send(emailData)
              .then((sent) => {
                //     console.log("SIGNUP EMAIL SENT", sent);
                // don't up the email here -- check theh link
                // look in teh new email -- the one you entered
              })
              .catch((err) => {
                // console.log('SIGNUP EMAIL SENT ERROR', err)
                return res.json({
                  message: err.message,
                });
              });
          }
        });
      } // end ok email
    } //end update email

    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed",
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      return res.json(updatedUser);
    });
  }); // end user
}; // end exports

exports.read = (req, res) => {
  const userId = req.params.id;
  User.findById(userId).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    user.hashed_password = undefined;
    user.salt = undefined;
    res.json(user);
  });
};

exports.contact = (req, res) => {
  const { name, email, message } = req.body;
  console.log(name, email, message);

  // mail for user
  const userEmailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Thanks for contacting`,
    html: `<div style='width:auto; padding:3rem;background-color:rgba(49,114,163,1)'><div style='font-family:inherit; text-align: center;background-color:rgba(116,188,217,1);color:white'><div style='margin:2rem;padding:1.5rem;margin-bottom:0rem'><span style='font-size: 24px'><strong>Thanks for Contacting us</strong></span></div></div><div style='margin-top:0.5rem;background-color:rgba(255,255,255,1);font-family: inherit; text-align: inherit'><div style='margin-top:0.5rem;padding:1.5rem;padding-bottom:0rem'><span style='margin:2rem;font-size: 20px; font-family: &quot;trebuchet ms&quot;, helvetica, sans-serif; color: #656565'>Hi ${req.body.name},</span></div></div><div style='background-color:rgba(255,255,255,1);font-family: inherit; text-align: inherit'></div><div style='padding:1rem;padding-bottom:0.05rem;background-color:rgba(255,255,255,1);font-family: inherit; text-align: inherit'><div style='margin:2rem;margin-top:0rem'><span style='font-size: 20px; font-family: &quot;trebuchet ms&quot;, helvetica, sans-serif; color: #656565'>Some one will contact you shortly</span></div></div><div style='margin-top:0.5rem;background-color:rgba(255,255,255,1);font-family: inherit; text-align: inherit'><div style='margin:0.5rem;margin-bottom:0rem;padding:1.5rem;padding-bottom:0rem'><span style='font-family: &quot;trebuchet ms&quot;, helvetica, sans-serif; font-size: 16px; color: #656565'>Thanks!</span></div></div><div style='background-color:rgba(255,255,255,1);font-family: inherit; text-align: inherit'><div style='margin:2rem;margin-top:0rem;padding-top:0rem;padding-bottom:1.5rem'><span style='font-family: &quot;trebuchet ms&quot;, helvetica, sans-serif; font-size: 16px; color: #656565'>Karen</span></div></div></div>`,
  };

  sgMail
    .send(userEmailData)
    .then((sent) => {
      return res.json({
        message: `Form submitted succesfully`,
      });
    })
    .catch((err) => {
      return res.json({
        message: err.message,
      });
    });

  // mail for admin
  const adminEmailData = {
    to: process.env.ADMIN_EMAIL, // Change to your recipient
    from: process.env.EMAIL_FROM, // Change to your verified sender
    subject: `${name} has tried to reach us`,
    html: `<div style='font-family: inherit; text-align: inherit'><span style='color: #80817f; font-size: 12px'><strong>Name:</strong></span><span style='color: #80817f; font-size: 12px'> ${name}</span></div>
          <div style='font-family: inherit; text-align: inherit'><span style='color: #80817f; font-size: 12px'><strong>Email:</strong></span><span style='color: #80817f; font-size: 12px'> ${email}</span></div>
          <div style='font-family: inherit; text-align: inherit'><span style='color: #80817f; font-size: 12px'><strong>Message:</strong></span><span style='color: #80817f; font-size: 12px'> ${message}</span></div>`,
  };
  sgMail
    .send(adminEmailData)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

exports.update = (req, res) => {
  // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
  const { name, email, password } = req.body;

  User.findOne({ _id: req.user._id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    if (!name) {
      return res.status(400).json({
        error: "Name is required",
      });
    } else {
      user.name = name;
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          error: "Password should be min 8 characters long",
        });
      } else {
        user.password = password;
      }
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: "Valid email requried",
        });
      }
    }
    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed",
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json(updatedUser);
    });
  });
};
