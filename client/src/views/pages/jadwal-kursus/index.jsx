import React from 'react';
import { Typography, Grid } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const JadwalKursus = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Jadwal Kursus">
          <Typography variant="body2">
            Halaman untuk menampilkan dan mengelola Jadwal Kursus.
          </Typography>
        </MainCard>
      </Grid>
    </Grid>
  );
};

export default JadwalKursus;