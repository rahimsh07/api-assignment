const express = require("express");
const app = express();

const axios = require("axios");
const mongoose = require("mongoose");

const port = 5000;

// Database connectino
const connectDB = () => {
  try {
    mongoose.connect("mongodb://127.0.0.1:27017/").then(() => {
      console.log("database connected");
    });
  } catch (err) {
    console.log(err);
  }
};
connectDB();

//creating Shcema
const RepositoryModel = mongoose.Schema(
  {
    url: String,
    data: [
      {
        id: Number,
        name: String,
        html_url: String,
        description: String,
        created_at: String,
        open_issues: Number,
        owner: {
          id: Number,
          avatavr_url: String,
          html_url: String,
          type: String,
          site_admin: Boolean,
        },
      },
    ],
  },
  { typeKey: "$name" }
);

const Repositry = mongoose.model("Repositry", RepositoryModel);

// Creating data fomation
const InfomationDto = class {
  constructor(data) {
    const { id, name, owner, html_url, created_at, open_issues, description } =
      data;

    return {
      id,
      name,
      html_url,
      description,
      created_at,
      open_issues,
      owner: {
        id: owner.id,
        avatar_url: owner.avatar_url,
        html_url: owner.html_url,
        type: owner.type,
        site_admin: owner.site_admin,
      },
    };
  }
};

app.use(express.json());

// Controller
const getData = async (req, res) => {
  const { id } = req.params;

  // checking there is any id
  if (!id) return res.json("Something went wrong");

  try {
    // Getting data from DB
    const response = await Repositry.findById(id);

    // checking is there any id
    if (!response) return res.json("Id not found");
    const { data } = response;

    // transforming data
    const resp = data.map((item) => new InfomationDto(item));

    // sendign response
    res.json({ success: true, data });
  } catch (err) {
    console.log(err);
  }
};

const postData = async (req, res) => {
  const { url } = req.body;

  // checking there is any url
  if (!url) return res.json("Url is required");

  try {
    // checking is url already present in DB
    const repoExits = await Repositry.find({ url });

    if (repoExits) return res.json("Repo are already existed");

    // fecthing data
    const { data } = await axios(url);

    // transforming the data
    const Data = data.map((item) => new InfomationDto(item));

    // saving in DB
    const repo = await Repositry.create({ url, data: Data });

    // sending response
    res.json({ success: true, repo });
  } catch (err) {
    return res.send(err);
  }
};

// routes setup
app.get("/github/:id", getData).post("/github", postData);

// listening the server
app.listen(port, () => {
  console.log(`server is working on http://localhost:${port}/`);
});