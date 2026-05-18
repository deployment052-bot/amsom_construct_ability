const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const getqoute = require('./routes/getqoute');
const newsslatter = require('./routes/newlatter');

app.use('/api/getquote', getqoute);
app.use('/api/newlatter', newsslatter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});