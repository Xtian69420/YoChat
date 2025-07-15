require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ Only declared once
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const dburl = process.env.DATABASE_URL;
mongoose.connect(dburl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const routes = require('./routes/routes');
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
