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

// Import File Routes
const jadwalRoutes = require('./routes/jadwalRoutes');
const hasilTesRoutes = require('./routes/hasilTesRoutes');
const rekapRoutes = require('./routes/rekapRoutes');

// Daftarkan Endpoint API
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/hasil-tes', hasilTesRoutes);
app.use('/api/rekap', rekapRoutes);

app.get('/', (req, res) => {
    res.send('Server UPA Bahasa Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server UPA Bahasa running di http://localhost:${PORT}`);
});