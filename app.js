const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const bcrypt = require("bcrypt");

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `insert into user(username,name,password,gender,location )
        values ( '${username}','${name}', '${hashedPassword}' ,'${gender}' ,'${location}');`;
    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//api 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username='${username}'; `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.send(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.send(400);
      response.send("Invalid password");
    }
  }
});

//api 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.send(400);
    response.send("Invalid user");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.Password);
    if (isValidPassword === true) {
      if (validatePassword(newPassword)) {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `update user set password='${encryptedPassword}',username='{username}';`;
        await db.run(updateQuery);
        response.send("Password updated");
      } else {
        response.send(400);
        response.send("Password is too short");
      }
    } else {
      response.send(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
