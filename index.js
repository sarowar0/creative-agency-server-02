const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const app = express()
const port = 5000

//express middleware
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(fileUpload());
app.use(express.static('uploads'));

//Mongodb connection
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Sarowar:agencyManage005@cluster0.lrix8.mongodb.net/agency-manager?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//Fiebase admin

const admin = require("firebase-admin");
const serviceAccount = require("./Config/creative-agency-02-firebase-adminsdk-y6407-82b260fe18.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


client.connect(err => {
  const orderCollection = client.db("agency-manager").collection("orders");
  const serviceCollection = client.db("agency-manager").collection("service")
  const adminCollection = client.db("agency-manager").collection("admin")
  const reviewCollection = client.db("agency-manager").collection("review")

  // Add orders
  app.post("/add-order", (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
      .then(result => {
        if (result.insertedCount > 0) {
          res.send(true);
        }
      })
  })

  //Add service
  app.post("/add-service", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;

    const newImg = file.data;
    const encImg = newImg.toString('base64');
    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    }
    serviceCollection.insertOne({ title, description, image })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  //Add review or feedback
  app.post('/add-review', (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  //Make admin
  app.post('/make-admin', (req, res) => {
    const email = req.body.email;
    adminCollection.insertOne({ email })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  //Check is admin
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({email: email})
    .toArray((err, documents) => {
      res.send(documents.length > 0)
    })
  })

  //Service list
  app.post('/service-list', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email})
    .toArray((err, admin) => {
      const filter = {};
      if (admin.length === 0) {
        filter.email = email;
      }
      orderCollection.find(filter)
      .toArray((err, orders) => {
        res.send(orders)
      })
    })
  })

  //Get Services
  app.get('/service', (req, res) => {
    serviceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  //Get feedback
  app.get('/get-review', (req, res) => {
    reviewCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})