import { Box, CircularProgress, Typography, Paper, Fade } from '@mui/material';

export default function LoadingSpinner({ message = 'Creating your vision scenes...' }) {
  return (
    <Fade in timeout={500}>
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 6, md: 8 },
          px: 3,
          mt: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
          <CircularProgress
            size={64}
            thickness={2}
            sx={{
              color: 'primary.light',
              animationDuration: '2s',
            }}
          />
          <CircularProgress
            size={64}
            thickness={2}
            sx={{
              color: 'secondary.main',
              animationDuration: '1.5s',
              position: 'absolute',
              left: 0,
              opacity: 0.4,
            }}
          />
        </Box>
        <Typography variant="body1" fontWeight={600} gutterBottom>
          {message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This usually takes 15-30 seconds
        </Typography>
      </Paper>
    </Fade>
  );
}
