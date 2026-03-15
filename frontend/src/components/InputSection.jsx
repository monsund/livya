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
} from '@mui/material';
import { CloudUpload, Send } from '@mui/icons-material';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (visionText.trim()) formData.append('vision', visionText);
    if (image) formData.append('image', image);
    
    onSubmit(formData, activeTab, duration);
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, md: 4 } }}>
      <Typography 
        variant="h5" 
        color="primary" 
        gutterBottom
        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
      >
        Share Your Vision
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Text" />
        <Tab label="Image" />
        <Tab label="Both" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={activeTab} index={0}>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            placeholder="Describe your vision...&#10;&#10;Examples:&#10;• Remote work, financial freedom, calm mornings&#10;• Building meaningful products, time for family&#10;• Minimal workspace, confidence, health"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Choose Image
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            placeholder="Add context or additional details about your vision board..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ textAlign: 'center' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Choose Image
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </TabPanel>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Target video length
          </Typography>
          <ToggleButtonGroup
            value={duration}
            exclusive
            onChange={(_, val) => { if (val !== null) setDuration(val); }}
            size="small"
            fullWidth
          >
            {[30, 60, 90].map(s => (
              <ToggleButton key={s} value={s} sx={{ fontWeight: 600 }}>
                {s}s
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            ~{Math.round(duration / 5)} scenes &nbsp;&bull;&nbsp; final video will be {duration - 2}–{duration + 2}s
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          sx={{ mt: 2 }}
        >
          {loading ? 'Processing...' : 'Generate Vision Scenes'}
        </Button>
      </form>
    </Paper>
  );
}
