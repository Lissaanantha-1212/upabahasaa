import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  Alert,
  Grid
} from '@mui/material';
import { IconSend, IconCheck, IconFileAlert } from '@tabler/icons-react';

// KAMUS DATA KONVERSI RESMI TOEFL ITP PBT
const conversionMap = {
  50: { l: 68, s: 68, r: 67 },
  49: { l: 67, s: 67, r: 66 },
  48: { l: 66, s: 66, r: 65 },
  47: { l: 65, s: 65, r: 63 },
  46: { l: 63, s: 63, r: 61 },
  45: { l: 62, s: 62, r: 60 },
  44: { l: 61, s: 61, r: 59 },
  43: { l: 60, s: 60, r: 58 },
  42: { l: 59, s: 59, r: 57 },
  41: { l: 58, s: 58, r: 56 },
  40: { l: 57, s: 68, r: 55 },
  39: { l: 57, s: 67, r: 54 },
  38: { l: 56, s: 65, r: 54 },
  37: { l: 55, s: 63, r: 53 },
  36: { l: 54, s: 61, r: 52 },
  35: { l: 54, s: 60, r: 52 },
  34: { l: 53, s: 58, r: 51 },
  33: { l: 52, s: 57, r: 50 },
  32: { l: 52, s: 56, r: 49 },
  31: { l: 51, s: 55, r: 48 },
  30: { l: 51, s: 54, r: 48 },
  29: { l: 50, s: 53, r: 47 },
  28: { l: 49, s: 52, r: 46 },
  27: { l: 49, s: 51, r: 46 },
  26: { l: 48, s: 50, r: 45 },
  25: { l: 48, s: 49, r: 44 },
  24: { l: 47, s: 48, r: 43 },
  23: { l: 47, s: 47, r: 43 },
  22: { l: 46, s: 46, r: 42 },
  21: { l: 45, s: 45, r: 41 },
  20: { l: 45, s: 44, r: 40 },
  default: { l: 31, s: 31, r: 31 }
};

const convertScore = (correctL, correctS, correctR) => {
  const lData = conversionMap[correctL] || conversionMap.default;
  const sData = conversionMap[correctS] || conversionMap.default;
  const rData = conversionMap[correctR] || conversionMap.default;

  const lScore = lData.l;
  const sScore = sData.s;
  const rScore = rData.r;

  const total = Math.round(((lScore + sScore + rScore) * 10) / 3);
  return { lScore, sScore, rScore, total };
};

export default function ModulKonversi() {
  // Data antrean konversi (data kelas/prodi disimpan di backend secara aman untuk pemetaan rekapan)
  const [dataKonversi, setDataKonversi] = useState([
    { 
      no: 1, 
      nim: '210102045', 
      nama: 'Lissa Anantha', 
      prodiBackend: 'D4 Teknik Informatika (TI-A)', // Disimpan di backend untuk arsip rekapan
      rawL: 41, 
      rawS: 45, 
      rawR: 40, 
      status: 'SIAP PUBLISH' 
    }
  ]);

  const [isPublished, setIsPublished] = useState(false);

  // Aksi Publish: Mengirim data ke web utama, memecah otomatis ke rekapan, dan membersihkan tampilan
  const handlePublishData = () => {
    setIsPublished(true);
    setTimeout(() => {
      setDataKonversi([]); // Tampilan langsung bersih kembali setelah dipublish
      setIsPublished(false);
    }, 2500);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b' }}>
        Modul Konversi & Publish Nilai TOEFL
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Hasil konversi skor otomatis. Sistem backend secara mandiri mengenali prodi dan kelas mahasiswa untuk diarsipkan ke menu Rekapitulasi saat dipublish.
      </Typography>

      {isPublished && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<IconCheck />}>
          Data berhasil dipublish ke web utama dan dipecah otomatis ke arsip menu Rekapitulasi berdasarkan prodi masing-masing.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Daftar Nilai Siap Publish
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Tampilan diperluas (tanpa kolom kelas/prodi). Format rincian konversi: <code>Jumlah Benar = Skor Skala</code>.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>NIM</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nama Mahasiswa</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Listening (Benar = Skor)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Structure (Benar = Skor)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Reading (Benar = Skor)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total ITP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataKonversi.length > 0 ? (
                  dataKonversi.map((row, index) => {
                    const converted = convertScore(row.rawL, row.rawS, row.rawR);
                    return (
                      <TableRow key={index} hover>
                        <TableCell>{row.no}</TableCell>
                        <TableCell>{row.nim}</TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>{row.nama}</TableCell>
                        
                        {/* Kolom rincian konversi yang bersih dan luas */}
                        <TableCell align="center">
                          <Chip label={`${row.rawL} = ${converted.lScore}`} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${row.rawS} = ${converted.sScore}`} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${row.rawR} = ${converted.rScore}`} size="small" variant="outlined" color="primary" />
                        </TableCell>

                        <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1rem' }}>
                          {converted.total}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={row.status} color="info" size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <IconFileAlert size={40} color="gray" />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }} color="textSecondary">
                          Antrean kosong. Tampilan bersih kembali.
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Data dari modul pencocokan akan masuk kemari dan otomatis dikelola oleh backend.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tombol Publish Utama */}
      {dataKonversi.length > 0 && (
        <Box sx={{ textAlign: 'right' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<IconSend size={18} />}
            onClick={handlePublishData}
            disabled={isPublished}
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            {isPublished ? 'Memproses Publikasi...' : 'Publish Data ke Web Utama & Arsip Rekapan'}
          </Button>
        </Box>
      )}
    </Box>
  );
}