const express = require('express');
const cors = require('cors');
const app = express();

// Izinkan akses CORS dari port frontend berapapun
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Import File Routes (disesuaikan posisinya naik 1 level ke ../routes)
const jadwalRoutes = require('../routes/jadwalRoutes');
const hasilTesRoutes = require('../routes/hasilTesRoutes');
const rekapRoutes = require('../routes/rekapRoutes');

// Daftarkan Endpoint API
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/hasil-tes', hasilTesRoutes);
app.use('/api/rekap', rekapRoutes);

app.get('/', (req, res) => {
    res.send('Server UPA Bahasa Running di Vercel!');
});

// Wajib diekspor untuk Vercel (jangan pakai app.listen di sini)
module.exports = app;