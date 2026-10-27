import React, { useState } from 'react';
import { 
  Typography, Grid, Button, Paper, Box, Alert, 
  IconButton, Card, TextField, Chip, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import MainCard from 'ui-component/cards/MainCard';
import * as XLSX from 'xlsx';

const HasilTestTOEIC = () => {
  const [fileExcel, setFileExcel] = useState(null);
  const [deskripsiPengumuman, setDeskripsiPengumuman] = useState(
    'Selamat kepada mahasiswa yang dinyatakan LULUS Ujian TOEIC Official/Prediction. Bagi mahasiswa yang namanya tercantum di bawah ini, silakan mengunduh sertifikat digital atau mengikuti arahan pendaftaran program lanjutan sesuai dengan prosedur UPA Bahasa POLNES.'
  );
  const [listMahasiswa, setListMahasiswa] = useState([]);
  const [isPublished, setIsPublished] = useState(false);

  // 1. Handle Upload Excel Kelulusan
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedData = data.map((item, index) => ({
        id: index + 1,
        nim: String(item.Nim || item.NIM || item.nim || '-'),
        nama: item.Nama || item.NAMA || item.nama || '-',
        prodi: item.Prodi || item.PRODI || item.Jurusan || 'Politeknik Negeri Samarinda',
        skor: item.Skor || item.SKOR || item.Score || item.TOEIC || 600,
        status: 'LULUS'
      }));

      setListMahasiswa(parsedData);
      setFileExcel({ name: file.name, totalData: parsedData.length });
    };
    reader.readAsBinaryString(file);
  };

  // 2. Hapus File Upload
  const handleDeleteFile = () => {
    setFileExcel(null);
    setListMahasiswa([]);
    setIsPublished(false);
  };

  // 3. Simpan & Publish ke Web Utama
  const handlePublish = () => {
    if (!fileExcel || listMahasiswa.length === 0) {
      alert('Upload file Excel data mahasiswa lulus TOEIC terlebih dahulu!');
      return;
    }
    setIsPublished(true);
    alert('Pengumuman Hasil TOEIC berhasil dipublikasikan ke Portal Web Utama UPA Bahasa POLNES!');
  };

  // Kalkulasi Ringkasan
  const totalLulus = listMahasiswa.length;
  const avgSkor = totalLulus > 0 ? Math.round(listMahasiswa.reduce((acc, curr) => acc + Number(curr.skor), 0) / totalLulus) : 0;
  const maxSkor = totalLulus > 0 ? Math.max(...listMahasiswa.map(m => Number(m.skor))) : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Modul Kelulusan TOEIC: UPA BAHASA POLNES">
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Halaman ini digunakan oleh staf untuk mengunggah daftar mahasiswa yang <b>LULUS Ujian TOEIC</b> serta memberikan pengumuman/arahan resmi. Data ini akan dipublikasikan secara otomatis ke portal utama web kampus.
          </Alert>

          <Grid container spacing={3}>
            
            {/* PANEL LEFT: FORM UPLOAD & DESKRIPSI ARAHAN */}
            <Grid item xs={12} md={5}>
              <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, height: '100%', bgcolor: '#ffffff' }}>
                <Typography variant="h4" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUploadIcon /> Upload Data & Pengumuman
                </Typography>

                {/* Upload File Box */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  1. File Excel Mahasiswa Lulus TOEIC:
                </Typography>
                <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: fileExcel ? '#f0fdf4' : '#fafafa', borderStyle: fileExcel ? 'solid' : 'dashed' }}>
                  {fileExcel ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          ✓ {fileExcel.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Terdeteksi: {fileExcel.totalData} Mahasiswa Lulus
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={handleDeleteFile}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                      sx={{ py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Pilih File Excel TOEIC
                      <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </Button>
                  )}
                </Card>

                {/* Deskripsi & Arahan Staf */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  2. Arahan & Deskripsi Pengumuman Staf:
                </Typography>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={6} 
                  value={deskripsiPengumuman}
                  onChange={(e) => setDeskripsiPengumuman(e.target.value)}
                  placeholder="Tuliskan arahan resmi, persyaratan klaim sertifikat, atau instruksi pendaftaran ulang..."
                  sx={{ mb: 3 }}
                />

                {/* Tombol Publikasi */}
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large"
                  fullWidth
                  startIcon={<SendIcon />}
                  onClick={handlePublish}
                  sx={{ py: 1.2, fontWeight: 'bold', borderRadius: 2 }}
                >
                  Publikasikan ke Web Utama
                </Button>
              </Paper>
            </Grid>

            {/* PANEL RIGHT: SIMULASI PRATINJAU WEB UTAMA */}
            <Grid item xs={12} md={7}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a' }}>
                    <ArticleIcon color="primary" /> Pratinjau Tampilan Portal Web Utama
                  </Typography>
                  <Chip 
                    label={isPublished ? "Status: Dipublikasikan" : "Status: Draf Staf"} 
                    color={isPublished ? "success" : "default"} 
                    size="small" 
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* KOP BANNER SIMULASI WEB UTAMA */}
                <Box sx={{ p: 2, bgcolor: '#1e293b', color: '#fff', borderRadius: 2, mb: 2 }}>
                  <Typography variant="h4" sx={{ color: '#38bdf8', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon /> PENGUMUMAN RESMI KELULUSAN TOEIC
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Unit Pelaksana Akademik (UPA) Bahasa — Politeknik Negeri Samarinda
                  </Typography>
                </Box>

                {/* BOX STATISTIK RINGKAS */}
                {totalLulus > 0 && (
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fff' }}>
                        <Typography variant="caption" color="textSecondary">Total Lulus</Typography>
                        <Typography variant="h4" color="primary">{totalLulus} Mhs</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fff' }}>
                        <Typography variant="caption" color="textSecondary">Rata-rata Skor</Typography>
                        <Typography variant="h4" color="success.main">{avgSkor}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fff' }}>
                        <Typography variant="caption" color="textSecondary">Skor Tertinggi</Typography>
                        <Typography variant="h4" color="warning.dark">{maxSkor}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* ISI DESKRIPSI PENGUMUMAN */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#ffffff' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    📢 Instruksi & Information for Students:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {deskripsiPengumuman || 'Belum ada deskripsi yang dituliskan staf.'}
                  </Typography>
                </Paper>

                {/* TABEL HASIL KELULUSAN WEB UTAMA */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📋 Daftar Mahasiswa Dinyatakan Lulus TOEIC:
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, bgcolor: '#fff' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }}><b>No</b></TableCell>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }}><b>NIM</b></TableCell>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }}><b>Nama Mahasiswa</b></TableCell>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }}><b>Program Studi</b></TableCell>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }} align="center"><b>Skor TOEIC</b></TableCell>
                        <TableCell sx={{ bgcolor: '#f1f5f9' }} align="center"><b>Status</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {listMahasiswa.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            Upload file Excel di panel kiri untuk menampilkan pratinjau daftar kelulusan di sini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        listMahasiswa.map((mhs, idx) => (
                          <TableRow key={mhs.id} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{mhs.nim}</TableCell>
                            <TableCell><b>{mhs.nama}</b></TableCell>
                            <TableCell>{mhs.prodi}</TableCell>
                            <TableCell align="center">
                              <Chip label={mhs.skor} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={mhs.status} color="success" variant="light" size="small" sx={{ fontWeight: 'bold' }} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

              </Paper>
            </Grid>

          </Grid>

        </MainCard>
      </Grid>
    </Grid>
  );
};

export default HasilTestTOEIC;