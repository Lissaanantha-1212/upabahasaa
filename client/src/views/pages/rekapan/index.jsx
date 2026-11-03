import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Breadcrumbs,
  Link,
  TextField,
  MenuItem,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  IconFolder, 
  IconUpload, 
  IconFileSpreadsheet, 
  IconDownload, 
  IconTrash, 
  IconCheck, 
  IconChevronRight, 
  IconPlus, 
  IconSearch,
  IconCertificate
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';

// Fungsi Pemetaan Otomatis Prodi ke 10 Jurusan Kampus
const resolveJurusanFromProdi = (prodiName) => {
  const p = prodiName.toUpperCase();
  if (p.includes('AKUNTANSI') || p.includes('KEUANGAN PERBANKAN')) return 'AKUNTANSI';
  if (p.includes('MANAJEMEN PEMASARAN') || p.includes('BISNIS DIGITAL')) return 'ADMINISTRASI BISNIS';
  if (p.includes('KETATALAKSANAAN') || p.includes('TEKNIKA') || p.includes('NAUTIKA')) return 'KEMARITIMAN';
  if (p.includes('PARIWISATA') || p.includes('USAHA PERJALANAN')) return 'PARIWISATA';
  if (p.includes('INFORMATIKA') || p.includes('KOMPUTER')) return 'TEKNOLOGI INFORMASI';
  if (p.includes('DESAIN') || p.includes('ARSITEKTUR')) return 'DESAIN';
  if (p.includes('PETRO') || p.includes('KIMIA')) return 'TEKNIK KIMIA';
  if (p.includes('KONSTRUKSI') || p.includes('JALAN') || p.includes('AIR')) return 'TEKNIK SIPIL';
  if (p.includes('ALAT BERAT') || p.includes('PERAWATAN') || p.includes('PRODUKSI')) return 'TEKNIK MESIN';
  if (p.includes('ELEKTRO') || p.includes('LISTRIK')) return 'TEKNIK ELEKTRO';
  return 'JURUSAN UMUM / LAINNYA';
};

export default function ModulRekapan() {
  const [folderList, setFolderList] = useState(['2024', '2025', '2026']);
  const [selectedYear, setSelectedYear] = useState(null);
  const [testCategory, setTestCategory] = useState('sspect');
  
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  const [masterFile, setMasterFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [parsedJurusanMap, setParsedJurusanMap] = useState(() => {
    const saved = localStorage.getItem('upa_bahasa_rekap_database');
    return saved ? JSON.parse(saved) : {};
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    localStorage.setItem('upa_bahasa_rekap_database', JSON.stringify(parsedJurusanMap));
  }, [parsedJurusanMap]);

  const handleAddFolder = () => {
    if (!newYearInput.trim()) return;
    if (!folderList.includes(newYearInput.trim())) {
      setFolderList([...folderList, newYearInput.trim()].sort());
    }
    setNewYearInput('');
    setOpenAddModal(false);
  };

  const handleMasterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMasterFile(file);
    setLoading(true);
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        
        const activeSheetName = workbook.SheetNames.includes('LAPORAN') ? 'LAPORAN' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[activeSheetName];
        const excelRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const temporaryProdiContainer = {};
        let activeProdiName = null;

        excelRows.forEach((row) => {
          const validRowCells = row.map((val, idx) => ({ val, idx })).filter(col => col.val !== null && col.val !== undefined && col.val !== '');
          if (validRowCells.length === 0) return;

          for (let i = 0; i < validRowCells.length; i++) {
            const cellText = String(validRowCells[i].val).trim();
            if ((cellText.includes('D3 -') || cellText.includes('D4 -') || cellText.includes('DII -')) 
                && !cellText.includes('HASIL') && !cellText.includes('REKAP')) {
              activeProdiName = cellText;
              if (!temporaryProdiContainer[activeProdiName]) {
                temporaryProdiContainer[activeProdiName] = [];
              }
              return;
            }
          }

          if (activeProdiName && validRowCells.length >= 6) {
            const rawValues = validRowCells.map(col => col.val);
            const rowNumber = rawValues[0];

            if (typeof rowNumber === 'number' && rowNumber >= 1 && rowNumber < 300) {
              const studentName = String(rawValues[1]).trim();
              const studentNim = String(rawValues[2]).trim();

              let extractedScore = '-';
              if (rawValues.length > 6 && typeof rawValues[6] === 'number') {
                extractedScore = Math.round(rawValues[6] * 10) / 10;
              }

              if (isNaN(Number(studentName)) && studentNim.length >= 7) {
                temporaryProdiContainer[activeProdiName].push({
                  no: parseInt(rowNumber),
                  nama: studentName,
                  nim: studentNim,
                  prodi: activeProdiName,
                  sspect: testCategory === 'sspect' ? extractedScore : '-',
                  toefl: testCategory.includes('toefl') ? extractedScore : '-',
                  toeic: testCategory === 'toeic' ? extractedScore : '-'
                });
              }
            }
          }
        });

        const structuredJurusanData = {};
        let totalStudentsCount = 0;

        Object.keys(temporaryProdiContainer).forEach(prodiKey => {
          const studentList = temporaryProdiContainer[prodiKey];
          if (studentList.length === 0) return;

          const parentJurusan = resolveJurusanFromProdi(prodiKey);
          if (!structuredJurusanData[parentJurusan]) {
            structuredJurusanData[parentJurusan] = [];
          }

          structuredJurusanData[parentJurusan].push({
            namaProdi: prodiKey,
            mahasiswa: studentList
          });
          totalStudentsCount += studentList.length;
        });

        setParsedJurusanMap(structuredJurusanData);
        setLoading(false);
        setSuccessMsg(`Berhasil memproses file "${file.name}". Ditemukan ${Object.keys(temporaryProdiContainer).length} Program Studi dengan total ${totalStudentsCount} Data Mahasiswa.`);
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('Gagal membaca file Excel.');
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
  };

  const handleClearData = () => {
    if (window.confirm('Hapus seluruh data arsip rekapan tahun ini?')) {
      setParsedJurusanMap({});
      setMasterFile(null);
      localStorage.removeItem('upa_bahasa_rekap_database');
      setSuccessMsg('');
    }
  };

  // Logika Filter & Sorting Cerdas: Jurusan dengan hasil pencarian naik ke atas, yang kosong disembunyikan
  const sortedAndFilteredJurusan = Object.entries(parsedJurusanMap)
    .map(([namaJurusan, prodiList]) => {
      const filteredProdiList = prodiList.map(prodi => {
        const filteredMahasiswa = prodi.mahasiswa.filter(m => 
          m.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
          m.nim.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
          ...prodi,
          filteredMahasiswa
        };
      }).filter(prodi => prodi.filteredMahasiswa.length > 0);

      const totalMatchedInJurusan = filteredProdiList.reduce((acc, p) => acc + p.filteredMahasiswa.length, 0);

      return {
        namaJurusan,
        prodiList: filteredProdiList,
        totalMatched: totalMatchedInJurusan
      };
    })
    .filter(jurusan => !searchQuery || jurusan.totalMatched > 0)
    .sort((a, b) => {
      if (searchQuery) {
        return b.totalMatched - a.totalMatched;
      }
      return 0;
    });

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b' }}>
        Modul Rekapitulasi & Arsip Nilai UPA Bahasa
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Pusat arsip nilai berbasis tahun dengan sistem ekstraksi file Excel otomatis tanpa manipulasi data.
      </Typography>

      <Breadcrumbs separator={<IconChevronRight size={16} />} sx={{ mb: 3 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          onClick={() => { setSelectedYear(null); setSuccessMsg(''); setSearchQuery(''); }} 
          sx={{ cursor: 'pointer', fontWeight: 'bold' }}
        >
          Folder Utama (Tahun)
        </Link>
        {selectedYear && <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>Tahun {selectedYear}</Typography>}
      </Breadcrumbs>

      {!selectedYear && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#334155' }}>
              Daftar Folder Tahun Arsip
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<IconPlus size={16} />}
              onClick={() => setOpenAddModal(true)}
              sx={{ fontWeight: 'bold', px: 2, py: 1 }}
            >
              Tambah Folder Tahun Baru
            </Button>
          </Box>

          <Grid container spacing={3}>
            {folderList.map((tahun) => (
              <Grid item xs={12} sm={4} key={tahun}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: '0.2s',
                    '&:hover': { boxShadow: 6, borderColor: 'primary.main', transform: 'translateY(-2px)' }, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 2 
                  }}
                  onClick={() => setSelectedYear(tahun)}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
                    <IconFolder size={50} color="#6366f1" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Tahun {tahun}</Typography>
                      <Typography variant="body2" color="textSecondary">Klik untuk kelola & upload rekapan</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {selectedYear && (
        <Box>
          <Card sx={{ mb: 3, p: 2.5, boxShadow: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Pilih Kategori Test / Ujian"
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                >
                  <MenuItem value="sspect">SSPECT (Semester 2)</MenuItem>
                  <MenuItem value="latihan_toefl">Latihan TOEFL</MenuItem>
                  <MenuItem value="test_toefl">Test TOEFL Resmi</MenuItem>
                  <MenuItem value="remedial_1">Remedial 1 TOEFL</MenuItem>
                  <MenuItem value="toeic">TOEIC</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cari Nama Mahasiswa atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#94a3b8' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={<IconUpload size={16} />}
                  sx={{ fontWeight: 'bold', px: 2.5, py: 1 }}
                >
                  {masterFile ? 'Ganti File Excel Master' : 'Upload File Master Excel (.xlsx)'}
                  <input type="file" hidden accept=".xlsx, .xls" onChange={handleMasterUpload} />
                </Button>
                {Object.keys(parsedJurusanMap).length > 0 && (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small" 
                    startIcon={<IconTrash size={16} />}
                    onClick={handleClearData}
                  >
                    Reset Data
                  </Button>
                )}
              </Grid>
            </Grid>
          </Card>

          {successMsg && (
            <Alert severity="success" sx={{ mb: 3 }} icon={<IconCheck />}>
              {successMsg}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={45} />
              <Typography sx={{ mt: 2, fontWeight: 'medium' }} color="textSecondary">
                Membaca sheet Excel, mengekstrak baris nama, NIM, dan memetakan jurusan secara presisi...
              </Typography>
            </Box>
          ) : Object.keys(parsedJurusanMap).length === 0 ? (
            <Card sx={{ textAlign: 'center', p: 8, border: '2px dashed #cbd5e1', backgroundColor: '#ffffff', borderRadius: 2 }}>
              <CardContent>
                <IconFileSpreadsheet size={55} color="#94a3b8" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#475569' }}>
                  Folder Tahun {selectedYear} Belum Memiliki Data Rekap
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                  Pilih kategori ujian di atas, lalu klik <strong>"Upload File Master Excel"</strong>. Sistem akan otomatis memetakan seluruh program studi ke dalam 10 jurusan kampus.
                </Typography>
              </CardContent>
            </Card>
          ) : sortedAndFilteredJurusan.length === 0 ? (
            <Card sx={{ textAlign: 'center', p: 6, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', borderRadius: 2 }}>
              <Typography variant="body1" color="textSecondary">
                Tidak ditemukan mahasiswa dengan kata kunci <strong>"{searchQuery}"</strong>.
              </Typography>
            </Card>
          ) : (
            <Box>
              {sortedAndFilteredJurusan.map(({ namaJurusan, prodiList }, jIdx) => (
                <Card key={jIdx} sx={{ mb: 5, boxShadow: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <Box sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', p: 2.5, borderBottom: '2px solid #bae6fd' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      JURUSAN: {namaJurusan}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
                    {prodiList.map((prodi, pIdx) => (
                      <Box key={pIdx} sx={{ mb: pIdx < prodiList.length - 1 ? 4 : 0 }}>
                        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, pb: 1, borderBottom: '2px solid #e2e8f0' }}>
                          <Grid item>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                              {prodi.namaProdi} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>({prodi.filteredMahasiswa.length} Mahasiswa Ditemukan)</span>
                            </Typography>
                          </Grid>
                          <Grid item>
                            <Button variant="contained" color="success" size="small" startIcon={<IconDownload size={16} />}>
                              Unduh Rekapan {prodi.namaProdi} (.xlsx)
                            </Button>
                          </Grid>
                        </Grid>

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1, maxHeight: 420 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9', width: '60px' }}>No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Nama Mahasiswa (Klik untuk Rincian Skor)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9', width: '180px' }}>NIM</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Program Studi</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {prodi.filteredMahasiswa.map((mhs, mIdx) => (
                                <TableRow key={mIdx} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                                  <TableCell>{mhs.no}</TableCell>
                                  <TableCell 
                                    onClick={() => handleStudentClick(mhs)}
                                    sx={{ 
                                      fontWeight: 'medium', 
                                      color: '#2563eb', 
                                      cursor: 'pointer', 
                                      '&:hover': { textDecoration: 'underline' } 
                                    }}
                                  >
                                    {mhs.nama}
                                  </TableCell>
                                  <TableCell>{mhs.nim}</TableCell>
                                  <TableCell>{mhs.prodi}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tambah Folder Tahun Baru</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Masukkan Tahun (Contoh: 2027)"
            value={newYearInput}
            onChange={(e) => setNewYearInput(e.target.value)}
            sx={{ my: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)} color="inherit">Batal</Button>
          <Button onClick={handleAddFolder} variant="contained">Simpan Folder</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconCertificate size={22} color="#0284c7" />
          Rangkuman Detail Skor Akademik Mahasiswa
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Nama Lengkap</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{selectedStudent.nama}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Nomor Induk Mahasiswa (NIM)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedStudent.nim}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Program Studi</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{selectedStudent.prodi}</Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', backgroundColor: '#eff6ff', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>SSPECT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2563eb' }}>{selectedStudent.sspect}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>TOEFL</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#16a34a' }}>{selectedStudent.toefl}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', backgroundColor: '#fffbeb', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>TOEIC</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d97706' }}>{selectedStudent.toeic}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {selectedStudent.toefl !== '-' && Number(selectedStudent.toefl) >= 450 && (
                <Button variant="contained" color="success" startIcon={<IconDownload />} sx={{ mt: 1, py: 1.2, fontWeight: 'bold' }}>
                  Unduh Sertifikat PDF Resmi Mahasiswa
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}