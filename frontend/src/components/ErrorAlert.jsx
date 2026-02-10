import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function ErrorAlert({ message, onClose }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity="error"
        icon={<ErrorOutline />}
        action={
          <Button color="inherit" size="small" onClick={onClose}>
            Close
          </Button>
        }
      >
        <AlertTitle>Error</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}
