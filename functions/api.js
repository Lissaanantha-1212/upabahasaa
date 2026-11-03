const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.use(express.json());

// Panggil rute jadwal
const jadwalRoutes = require('../routes/jadwalRoutes');
app.use('/api/jadwal', jadwalRoutes);

module.exports.handler = serverless(app);