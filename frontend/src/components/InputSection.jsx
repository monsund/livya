import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
  Stack,
  Avatar,
  Tooltip,
} from '@mui/material';
import { CloudUpload, Send, TimerOutlined, DeleteOutline, PersonOutline, InfoOutlined } from '@mui/icons-material';
import TabPanel from './TabPanel';

export default function InputSection({ onSubmit, loading }) {
  const [activeTab, setActiveTab] = useState(0);
  const [visionText, setVisionText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [duration, setDuration] = useState(60);
  const [protagonist, setProtagonist] = useState(null);
  const [protagonistPreview, setProtagonistPreview] = useState(null);
  const [protagonistGender, setProtagonistGender] = useState(null);

  const handleProtagonistChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProtagonist(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProtagonistPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

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
    if (protagonist) formData.append('protagonist', protagonist);
    if (protagonistGender) formData.append('protagonistGender', protagonistGender);
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
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3.5, md: 4 },
        mb: { xs: 2, md: 4 },
        borderRadius: 4,
        backdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          mb: 2.5,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        Describe Your Vision
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          minHeight: 42,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
            background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }
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
            sx={{
              "& .MuiOutlinedInput-root": {
                background: "rgba(255,255,255,0.05)",
                borderRadius: 3,
              },
              "& textarea": {
                fontSize: "0.95rem",
              }
            }}
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

        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'stretch' }}>

          {/* Duration selector */}
          <Box
            sx={{
              flex: 3,
              p: 2.5,
              borderRadius: 3,
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid",
              borderColor: "divider",
            }}
          >
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
              sx={{
                mb: 1,
                "& .MuiToggleButton-root": {
                  borderRadius: "10px !important",
                  border: "1px solid rgba(0,0,0,0.1)",
                  textTransform: "none",
                  py: 1,
                },
                "& .Mui-selected": {
                  background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                }
              }}
            >
              {[
                { value: 30, label: '30s', sub: '~6 scenes' },
                { value: 60, label: '60s', sub: '~12 scenes' },
                { value: 90, label: '90s', sub: '~18 scenes' },
              ].map(opt => (
                <ToggleButton
                  key={opt.value}
                  value={opt.value}
                  sx={{ py: 1, flexDirection: "column", gap: 0.2, fontSize: "0.8rem" }}
                >
                  <Typography variant="body2" fontWeight={700}>{opt.label}</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>{opt.sub}</Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="caption" color="text.secondary">
              Final video: {duration - 2}–{duration + 2}s
            </Typography>
          </Box>

          {/* Protagonist upload */}
          <Box
            sx={{
              flex: 2,
              p: 2.5,
              borderRadius: 3,
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PersonOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Protagonist
              </Typography>
              <Tooltip
                title="The protagonist is the main character who appears in your video scenes. Upload a photo and select their gender so the AI can generate consistent visuals featuring that person throughout the story."
                placement="top"
                arrow
                componentsProps={{
                  tooltip: { sx: { maxWidth: 260, fontSize: '0.72rem', lineHeight: 1.55, bgcolor: 'rgba(30,30,40,0.97)', border: '1px solid rgba(255,255,255,0.12)' } },
                  arrow: { sx: { color: 'rgba(30,30,40,0.97)' } },
                }}
              >
                <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
                  <InfoOutlined sx={{ fontSize: 16, color: '#a78bfa' }} />
                </Box>
              </Tooltip>
            </Box>

            <Stack spacing={1.2}>
              <ToggleButtonGroup
                value={protagonistGender}
                exclusive
                onChange={(_, val) => setProtagonistGender(val)}
                size="small"
                sx={{ gap: 0.5 }}
              >
                <ToggleButton
                  value="male"
                  sx={{ px: 2, borderRadius: "20px !important", textTransform: "none", fontSize: "0.8rem" }}
                >
                  Male
                </ToggleButton>
                <ToggleButton
                  value="female"
                  sx={{ px: 2, borderRadius: "20px !important", textTransform: "none", fontSize: "0.8rem" }}
                >
                  Female
                </ToggleButton>
              </ToggleButtonGroup>

              {protagonistPreview ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={protagonistPreview}
                    sx={{ width: 60, height: 60, borderRadius: 2 }}
                    variant="rounded"
                  />
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutline />}
                    onClick={() => {
                      setProtagonist(null);
                      setProtagonistPreview(null);
                      setProtagonistGender(null);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              ) : (
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUpload />}
                  sx={{ borderRadius: 2, textTransform: "none", width: "fit-content" }}
                >
                  Upload photo
                  <input type="file" hidden accept="image/*" onChange={handleProtagonistChange} />
                </Button>
              )}
            </Stack>
          </Box>

        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 15 }} />}
            sx={{
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: 3,
              py: 0.8,
              px: 3,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
              boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
              "&:hover": {
                background: "linear-gradient(90deg,#5b5ff0,#7c3aed,#db2777)"
              }
            }}
          >
            {loading ? 'Processing...' : 'Generate Vision Scenes'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
