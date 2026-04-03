import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisionProvider from "../context/VisionContext";

const useVision = VisionProvider.useVision;
const API_URL = import.meta.env.VITE_API_URL || 'https://livya.onrender.com';


export default function CreateInputScreen({ onNavigate }) {
  const { visionData, updateVisionData, createVisionText } = useVision();
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Local state for form inputs
  const [title, setTitle] = useState(visionData.title);
  const [description, setDescription] = useState(visionData.description);
  const [duration, setDuration] = useState(visionData.duration);
  const [selectedImages, setSelectedImages] = useState([]);

  // Update context when local state changes (only when not loading to avoid interference)
  useEffect(() => {
    if (!visionData.isLoading) {
      updateVisionData({ title, description, duration });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, duration, visionData.isLoading]);

  // Check if form has any input
  const hasInput = title.trim() || description.trim() || selectedImages.length > 0;

  const handleSubmit = async () => {
    if (!hasInput) return;

    const vision = createVisionText();
    if (!vision && !selectedImages.length) {
      setError("Please provide a title or description");
      return;
    }

    // Clear any existing mock data and update loading state
    updateVisionData({ 
      isLoading: true,
      error: null,
      title,
      description,
      duration,
      // Clear mock data when generating new scenes from API
      elements: null,
      scenes: null,
      images: null,
      videos: null,
      finalVideo: null
    });

    // Navigate to GenerateScenes immediately
    onNavigate(2);

    // Small delay to ensure navigation completes before starting SSE
    setTimeout(async () => {
      try {

        // Use FormData for multiple image upload
        const formData = new FormData();
        formData.append('vision', vision);
        formData.append('duration', duration);
        formData.append('protagonistBase64', visionData.protagonistBase64 || '');
        formData.append('protagonistGender', visionData.protagonistGender || '');
        // Attach all selected images as 'images'
        if (selectedImages.length > 0) {
          selectedImages.forEach((imgObj) => {
            if (imgObj.file) {
              formData.append('images', imgObj.file);
            }
          });
        }

        // Add Authorization header with token from localStorage
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/vision-stream`, {
          method: 'POST',
          body: formData,
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }

        // Handle the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const parsed = JSON.parse(line.slice(6));
              const { type, data } = parsed;

              if (type === 'elements') {
                updateVisionData({ elements: data });
              } else if (type === 'scenes') {
                updateVisionData({ scenes: data });
              } else if (type === 'image') {
                updateVisionData(prev => {
                  const newImages = prev.images ? [...prev.images, data] : [data];
                  return { images: newImages };
                });
              } else if (type === 'image-error') {
                showSnackbar(`Image generation failed for a scene`, 'warning');
              } else if (type === 'error') {
                showSnackbar(`Stream error: ${data?.message || 'Unknown error'}`, 'error');
                throw new Error(data.message);
              } else if (type === 'done') {
                showSnackbar('Storyboard generated successfully!', 'success');
              }
            } catch {
              showSnackbar('Failed to parse a stream update — some data may be missing', 'warning');
            }
          }
        }

        // Generation completed successfully
        updateVisionData({ isLoading: false });

      } catch (err) {
        showSnackbar(err.message || 'Failed to generate scenes. Please try again.', 'error');
        updateVisionData({ 
          isLoading: false, 
          error: err.message || 'Failed to generate scenes. Please try again.' 
        });
      }
    }, 100); // Small delay to ensure navigation completes
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Clean up URL object
      URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [selectedImages]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 20%, rgba(168,139,250,0.25), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(244,114,182,0.25), transparent 40%),
          linear-gradient(135deg, #f5f3ff, #fdf4ff)
        `,
        pt: 4,
      }}
    >
      <Container maxWidth="sm" sx={{mt: -2, pb: 14}}>

        {/* ================= HEADER ================= */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Create Your Vision ✨
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
            Visualize your future in seconds
          </Typography>
        </Box>

        {/* ================= MAIN CARD ================= */}
        <Paper
          sx={{
            width: "100%",
            p: 2,
            borderRadius: 4,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <Typography fontWeight={700} mb={2}>
            Describe Your Vision
          </Typography>

          {/* TITLE */}
          <TextField
            fullWidth
            label="Title of Your Vision"
            placeholder="E.g., Dream House by the Lake"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* DESCRIPTION */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            placeholder="E.g., A beautiful modern home overlooking a serene lake at sunset"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* ================= UPLOAD ================= */}
          <Typography fontWeight={600} mb={1}>
            Upload Images
          </Typography>

          {/* Hidden file input */}
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {/* Upload area */}
          <Box
            component="label"
            htmlFor="image-upload"
            sx={{
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              border: "2px dashed #a78bfa",
              background:
                "linear-gradient(135deg, rgba(168,139,250,0.1), rgba(244,114,182,0.1))",
              mb: 2,
              cursor: "pointer",
              transition: "0.3s",
              display: "block",
              "&:hover": {
                borderColor: "#ec4899",
                background:
                  "linear-gradient(135deg, rgba(168,139,250,0.2), rgba(244,114,182,0.2))",
              },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />

            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Drag & drop or click to browse multiple images
            </Typography>
            
            {selectedImages.length > 0 && (
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#8b5cf6" }}>
                {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
              </Typography>
            )}
          </Box>

          {/* Selected images display */}
          {selectedImages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} mb={1}>
                Selected Images:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedImages.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "2px solid #e5e7eb",
                      "&:hover .delete-overlay": {
                        opacity: 1,
                      },
                    }}
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    
                    {/* Hover overlay for better visibility */}
                    <Box
                      className="delete-overlay"
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.3)",
                        opacity: 0,
                        transition: "opacity 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    
                    <IconButton
                      onClick={() => removeImage(index)}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(0,0,0,0.7)",
                        color: "white",
                        width: 24,
                        height: 24,
                        minWidth: 24,
                        border: "1px solid rgba(255,255,255,0.3)",
                        "&:hover": {
                          bgcolor: "#ef4444",
                          transform: "scale(1.1)",
                        },
                      }}
                      size="small"
                    >
                      <CloseIcon sx={{ fontSize: 16, fontWeight: "bold" }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ================= DURATION SELECTOR ================= */}
          <Box mb={2}>
            <Typography fontWeight={600} mb={1}>
              Video Duration
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "space-around",
              }}
            >
              {[30, 60, 90].map((secs) => (
                <Button
                  key={secs}
                  onClick={() => setDuration(secs)}
                  variant={duration === secs ? "contained" : "outlined"}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    background:
                      duration === secs
                        ? "linear-gradient(90deg,#a78bfa,#ec4899)"
                        : "transparent",
                    color: duration === secs ? "#fff" : "#6b7280",
                    border:
                      duration === secs
                        ? "none"
                        : "2px solid #d1d5db",
                    transition: "0.3s",
                    "&:hover": {
                      borderColor:
                        duration !== secs ? "#a78bfa" : undefined,
                      background:
                        duration === secs
                          ? "linear-gradient(90deg,#a78bfa,#ec4899)"
                          : undefined,
                    },
                  }}
                >
                  {secs}s
                </Button>
              ))}
            </Box>
          </Box>

          {/* EXAMPLES */}
          <Box mb={2}>
            <Typography fontWeight={600} mb={1}>
              Example Prompts:
            </Typography>

            {[
              "Tropical Beach Vacation",
              "Successful Business Meeting",
              "Hiking in the Mountains",
            ].map((item) => (
              <Typography
                key={item}
                sx={{ opacity: 0.7, mb: 0.5 }}
              >
                ✦ {item}
              </Typography>
            ))}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ================= CTA TEXT ================= */}
          <Typography
            textAlign="center"
            sx={{ mt: 3, fontWeight: 600 }}
          >
            Turn your vision into a cinematic story
          </Typography>

          {/* ================= BUTTON ================= */}
          <Button
            fullWidth
            disabled={!hasInput || visionData.isLoading}
            onClick={handleSubmit}
            startIcon={visionData.isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{
              mt: 2,
              py: 1.6,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 16,
              background: (hasInput && !visionData.isLoading)
                ? "linear-gradient(90deg,#a78bfa,#ec4899)"
                : "#e5e7eb",
              color: (hasInput && !visionData.isLoading) ? "white" : "#9ca3af",
              boxShadow: (hasInput && !visionData.isLoading)
                ? "0 10px 25px rgba(168,139,250,0.4)"
                : "none",
              "&:hover": {
                background: (hasInput && !visionData.isLoading)
                  ? "linear-gradient(90deg,#a78bfa,#ec4899)"
                  : "#e5e7eb",
              },
            }}
            variant="contained"
          >
            {visionData.isLoading ? "Building My Storyboard..." : "Build My Storyboard"}
          </Button>

          {/* FOOTNOTE */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 1.5,
              opacity: hasInput ? 0.6 : 0.4,
              color: hasInput ? "inherit" : "#9ca3af",
            }}
          >
            {visionData.isLoading
              ? "🎬 Creating your personalized scenes..."
              : hasInput 
                ? "✨ AI will generate scenes based on your input"
                : "💡 Add a title, description, or upload images to continue"
            }
          </Typography>
        </Paper>
      </Container>

      {/* ================= SNACKBAR ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 6000 : 4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
