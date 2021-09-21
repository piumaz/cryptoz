const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
const coinbase = require('./coinbase.api');

const PORT = 3000;
const HOST = "localhost";

const app = express();

// Logging
app.use(morgan('dev'));
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use('/coinbase', coinbase);

app.listen(PORT, HOST, () => {
  console.log(`Starting at ${HOST}:${PORT}`);
});
