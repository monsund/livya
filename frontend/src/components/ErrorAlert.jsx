import { Alert, AlertTitle, Button, Box, Fade } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function ErrorAlert({ message, onClose }) {
  return (
    <Fade in timeout={300}>
      <Box sx={{ my: 2 }}>
        <Alert
          severity="error"
          icon={<ErrorOutline />}
          action={
            <Button color="inherit" size="small" onClick={onClose} sx={{ fontWeight: 600 }}>
              Dismiss
            </Button>
          }
          sx={{
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'error.light',
            '& .MuiAlert-icon': { alignItems: 'center' },
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>Something went wrong</AlertTitle>
          {message}
        </Alert>
      </Box>
    </Fade>
  );
}
