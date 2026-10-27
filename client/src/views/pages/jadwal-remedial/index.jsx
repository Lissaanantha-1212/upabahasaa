import React from 'react';
import { Typography, Grid } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const JadwalRemedial = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Jadwal Remedial">
          <Typography variant="body2">
            Halaman untuk menampilkan dan mengelola Jadwal Remedial.
          </Typography>
        </MainCard>
      </Grid>
    </Grid>
  );
};

export default JadwalRemedial;