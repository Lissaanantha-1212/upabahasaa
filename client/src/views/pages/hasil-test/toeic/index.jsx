import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Paper, Alert } from '@mui/material';
import { IconUpload, IconTrash, IconAlertCircle } from '@tabler/icons-react';

export default function UploadHasilTestTOIEC() {
  const [lab, setLab] = useState('Lab A');
  const [sesi, setSesi] = useState('1');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmit = () => {
    if (!uploadedFile) {
      alert('Harap upload file TOIEC terlebih dahulu.');
      return;
    }
    setSuccessMessage('Data Hasil Test TOIEC beserta deskripsi berhasil disimpan ke sistem.');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
        Modul Upload Hasil Test - TOIEC
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Upload dokumen hasil test TOIEC dan tambahkan catatan deskripsi secara mandiri.
      </Typography>

      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Pilih Ruang Lab" value={lab} onChange={(e) => setLab(e.target.value)}>
                <MenuItem value="Lab A">Lab Komputer Bahasa A</MenuItem>
                <MenuItem value="Lab B">Lab Komputer Bahasa B</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Pilih Sesi Ujian" value={sesi} onChange={(e) => setSesi(e.target.value)}>
                <MenuItem value="1">Sesi 1 (08:00 - 10:00)</MenuItem>
                <MenuItem value="2">Sesi 2 (10:00 - 12:00)</MenuItem>
                <MenuItem value="3">Sesi 3 (13:00 - 15:00)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Upload File & Deskripsi Mandiri</Typography>
          
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 3 }}>
            {uploadedFile ? (
              <Box>
                <Typography variant="body2">{uploadedFile.name}</Typography>
                <IconButton color="error" onClick={() => setUploadedFile(null)}><IconTrash size={20} /></IconButton>
              </Box>
            ) : (
              <Button component="label" variant="outlined" startIcon={<IconUpload />} size="small">
                Pilih File TOIEC (.xlsx / .pdf)
                <input type="file" hidden onChange={handleUpload} />
              </Button>
            )}
          </Paper>

          {/* Kolom Deskripsi Tambahan Mandiri oleh Staff */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Deskripsi / Catatan Tambahan (Opsional)"
            placeholder="Tambahkan keterangan atau catatan khusus terkait hasil test TOIEC ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Simpan Data TOIEC
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}