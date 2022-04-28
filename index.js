const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env
  .DB_PASS}@cluster0.hisaf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("services");
    const orderCollection = client.db("geniusCar").collection("order");

    //AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d"
      });
      res.send({ accessToken });
    });

    //SERVICE API
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const services = await serviceCollection.findOne(query);
      res.send(services);
    });

    //post data
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    //DELETE
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    //order post data
    app.get("/order", verifyJWT, async (req, res) => {
      const decodeEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodeEmail) {
        const query = {};
        const cursor = orderCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }else{
        res.status(403).send({message:'Forbidden access'})
      }
    });

    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("running mongodb database server site");
});

app.listen(port, () => {
  console.log("listening app", port);
});
