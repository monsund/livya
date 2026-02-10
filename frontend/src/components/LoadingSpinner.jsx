import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSpinner({ message = 'Creating your vision scenes...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
}