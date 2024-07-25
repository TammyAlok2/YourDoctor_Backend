const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const auth = require('./routes/auth');
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to Database"))
.catch(err => console.error(err));

app.use('/api/auth', auth);

app.listen(PORT, () => {
    console.log(`Server is up at ${PORT}`);
});
