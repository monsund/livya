import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
  Stack,
} from '@mui/material';
import { CloudUpload, Send, TimerOutlined, DeleteOutline } from '@mui/icons-material';
import TabPanel from './TabPanel';

export default function InputSection({ onSubmit, loading }) {
  const [activeTab, setActiveTab] = useState(0);
  const [visionText, setVisionText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [duration, setDuration] = useState(60);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (visionText.trim()) formData.append('vision', visionText);
    if (image) formData.append('image', image);
    onSubmit(formData, activeTab, duration);
  };

  const imageUploadBlock = (
    <Box
      sx={{
        textAlign: 'center',
        border: '2px dashed',
        borderColor: imagePreview ? 'primary.main' : 'grey.300',
        borderRadius: 3,
        p: 3,
        transition: 'all 0.2s',
        bgcolor: imagePreview ? 'primary.50' : 'grey.50',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
      }}
    >
      {imagePreview ? (
        <Fade in>
          <Box>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={handleRemoveImage}>
                Remove
              </Button>
            </Box>
          </Box>
        </Fade>
      ) : (
        <Button
          component="label"
          variant="text"
          startIcon={<CloudUpload />}
          sx={{ py: 2, px: 4, fontSize: '0.95rem', color: 'text.secondary' }}
        >
          Drop an image or click to browse
          <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleImageChange} />
        </Button>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3.5, md: 4 }, mb: { xs: 2, md: 4 } }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2.5 }}>
        Share Your Vision
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="✏️ Text" />
        <Tab label="🖼️ Image" />
        <Tab label="✨ Both" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={activeTab} index={0}>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            placeholder={"Describe your vision...\n\nExamples:\n• Remote work, financial freedom, calm mornings\n• Building meaningful products, time for family\n• Minimal workspace, confidence, health"}
            variant="outlined"
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {imageUploadBlock}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={visionText}
              onChange={(e) => setVisionText(e.target.value)}
              placeholder="Add context or details about your vision board..."
              variant="outlined"
            />
            {imageUploadBlock}
          </Stack>
        </TabPanel>

        {/* Duration selector */}
        <Box sx={{ mt: 3, p: 2.5, bgcolor: 'grey.50', borderRadius: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TimerOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary">
              Video Duration
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={duration}
            exclusive
            onChange={(_, val) => { if (val !== null) setDuration(val); }}
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          >
            {[
              { value: 30, label: '30s', sub: '~6 scenes' },
              { value: 60, label: '60s', sub: '~12 scenes' },
              { value: 90, label: '90s', sub: '~18 scenes' },
            ].map(opt => (
              <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1, flexDirection: 'column', gap: 0.2 }}>
                <Typography variant="body2" fontWeight={700}>{opt.label}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>{opt.sub}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            Final video: {duration - 2}–{duration + 2}s
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
          sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
        >
          {loading ? 'Processing...' : 'Generate Vision Scenes'}
        </Button>
      </form>
    </Paper>
  );
}
