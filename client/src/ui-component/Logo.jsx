// material-ui
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

// ==============================|| LOGO TEXT ||============================== //

export default function Logo() {
  const theme = useTheme();

  return (
    <Typography 
      variant="h4" 
      sx={{ 
        fontWeight: 'bold', 
        color: theme.palette.text.primary, 
        letterSpacing: '1px' 
      }}
    >
      UPA BAHASA
    </Typography>
  );
}