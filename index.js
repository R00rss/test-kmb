import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
// import querystring from "querystring";
import fileUpload from "express-fileupload";

//functions and utils
import { responseMessages } from "./utils/genericMessages.js";
import { requestLogger, unknownEndpoint } from "./utils/customMiddleware.js";
import { connectToMongos } from "./functions/connectToMongos.js";
import { decodeToken, encodeToken } from "./utils/manageTokens.js";
//models
import { getUserModel } from "./models/user.js";
import { getDataModel } from "./models/data.js";
//to manage paths and env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

//custom morgan token
morgan.token("body", (req) => {
  return JSON.stringify(req.body);
});

//Inicializate app
const app = express();
app.use(cors());
//MIDDLEWARES
app.use(express.json());
app.use(requestLogger);
app.use(morgan(":method :url :status :response-time ms :body"));
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 2 * 1024 * 1024 * 1024, //2MB max file(s) size
    },
  })
);

//to use static files
app.use("/", express.static("dist"));
app.use(express.static("uploads"));

const connection = await connectToMongos();
const userModel = getUserModel(connection);
const dataModel = getDataModel(connection);

app.get("/", (request, response) => {
  response.send("Hello World");
});

app.get("/api/users", (request, response) => {
  userModel.find({}).then((users) => {
    return response.json({ users });
  });
});

app.get("/api/data", (request, response) => {
  dataModel.find({}).then((data) => {
    return response.json({ data });
  });
});
app.post("/api/userAuth", (request, response) => {
  const body = request.body;
  if (!body.name) {
    return response.status(400).json({
      error: responseMessages.create.missingContent,
    });
  }
  const currentName = body.name;

  userModel.findOne({ name: currentName }).then((userThatMatch) => {
    if (userThatMatch) {
      const token = encodeToken(
        {
          id: userThatMatch.id,
          name: userThatMatch.name,
        },
        process.env.SECRET
      );

      console.log("decode token", decodeToken(token, process.env.SECRET));
      return response.status(200).json({ token, currentName });
    }
    return response
      .status(400)
      .json({ message: "no existe ese nombre en la colecion users" });
  });
});

app.post("/api/sendData", (request, response) => {
  const files = request.files;
  const token = request.query.token;
  const userData = decodeToken(token, process.env.SECRET);
  let path = "";
  if (userData.name && userData.id) {
    console.log("entro!");
    userModel.findOne({ name: userData.name }).then((user) => {
      if (user) {
        console.log("entro x2");
        Object.keys(files).forEach((key) => {
          // path = `${__dirname}/uploads/${userData.id}/${files[key].name}`;
          path = `${__dirname}/uploads/${userData.id}`;
          console.log(path);
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          files[key].mv(`${path}/${files[key].name}`, (err) => {
            console.log(err);
            return response.status(500);
          });
        });
        return response.status(200).json({
          message: "file updated",
          token: token,
          decodeToken: decodeToken(token, process.env.SECRET),
          path: path,
        });
      }
      return response.status(501);
    });
  }
  return response.status(400);
});
app.get("/api/getData", (request, response) => {
  const token = request.query.token;
  const userData = decodeToken(token, process.env.SECRET);
  if (userData.name && userData.id) {
    userModel.findOne({ name: userData.name }).then((user) => {
      if (user) {
        const path = `${__dirname}/uploads/${userData.id}`;
        if (fs.existsSync(path)) {
          const files = fs.readdirSync(path);
          return response.status(200).sendFile(`${path}/${files[0]}`);
        }
        return response.status(200).json({ files: [] });
      }
      return response.status(501);
    });
  }
  return response.status(400);
});
//unknownEndpoint need to be at the end
//couse is the last route to match,
//also this middleware doens't have next() function
app.use(unknownEndpoint);

//STARTING THE SERVER ON A EXPLICIT PORT
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
