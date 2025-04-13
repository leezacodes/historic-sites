require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String,
  }],
  country: String,
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (!userData.userName || !userData.password || !userData.password2 || !userData.email) {
        return reject("All fields are required");
    }
    
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match!");
    }

    bcrypt.hash(userData.password, 10).then((hash) => {
        userData.password = hash;
        let newUser = new User(userData);
  
        newUser.save().then(() => {
          resolve();
        }).catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err);
          }
        });
      }).catch(() => {
        reject("There was an error encrypting the password");
      });
  });
};

module.exports.checkUser = function(userData){
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
          .exec()
          .then((users) => {
            if (users.length === 0) {
              reject(`Unable to find user: ${userData.userName}`);
              return;
            }
            bcrypt.compare(userData.password, users[0].password).then((result) => {
              if (result === false) {
                reject(`Incorrect Password for user: ${userData.userName}`);
              } else if (result === true) {
                if (users[0].loginHistory.length == 8) {
                  users[0].loginHistory.pop();
                }
                users[0].loginHistory.unshift({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });
    
                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    // updated user login
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject(`There was an error verifying the user: ${err}`);
                  });
              }
            });
          })
          .catch((err) => {
            reject(`Unable to find user: ${userData.userName}`);
          });
      });
};
