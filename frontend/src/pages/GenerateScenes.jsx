import { Box, Container, Typography, Paper, LinearProgress, Button, Snackbar, Alert } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import VisionProvider from "../context/VisionContext";
import { mockData } from "../mockData/mockData";

const useVision = VisionProvider.useVision;

export default function GeneratingScenes({ onNavigate }) {
  const { visionData, updateVisionData } = useVision();
  const hasAutoNavigated = useRef(false);
  const lastImageCount = useRef(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Test function to load mockData
  const loadMockData = () => {
    updateVisionData({
      elements: mockData.elements,
      scenes: mockData.scenes,
      images: mockData.images,
      videos: mockData.videos,  // ✅ Now loading videos too!
      isLoading: false
    });
  };

  // Derive currentStep and progress from visionData (no state needed)
  const getCurrentStep = () => {
    const imageCount = visionData.images?.length || 0;
    const sceneCount = visionData.scenes?.length || 0;
        
    if (imageCount > 0) return 4; // Completed
    if (sceneCount > 0) return 3; // Generating images  
    if (visionData.elements) return 2; // Creating scenes
    return 1; // Extracting elements
  };

  const getProgress = () => {
    const step = getCurrentStep();
    switch (step) {
      case 4: return 100; // Completed
      case 3: {
        // More granular progress during image generation
        const totalScenes = visionData.scenes?.length || 0;
        const completedImages = visionData.images?.length || 0;
        if (totalScenes === 0) return 66;
        const imageProgress = (completedImages / totalScenes) * 34; // 34% range for images (66% + 34% = 100%)
        return Math.min(66 + imageProgress, 100);
      }
      case 2: return 33;  // Creating scenes
      default: return 0; // Extracting elements
    }
  };

  const currentStep = getCurrentStep();
  const progress = getProgress();

  // Handle navigation when completed (only on fresh completion, not when revisiting)
  useEffect(() => {
    const currentImageCount = visionData.images?.length || 0;
    
    // Reset auto-navigation flag when starting fresh (no images)
    if (currentImageCount === 0) {
      hasAutoNavigated.current = false;
      lastImageCount.current = 0;
      return;
    }
    
    // Only auto-navigate if:
    // 1. We have images
    // 2. Image count increased (fresh completion)
    // 3. We haven't already auto-navigated for this session
    if (currentImageCount > 0 && 
        currentImageCount > lastImageCount.current && 
        !hasAutoNavigated.current) {
      
      hasAutoNavigated.current = true;
      const timeout = setTimeout(() => {
        onNavigate(3);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
    
    // Update the last known image count
    lastImageCount.current = currentImageCount;
  }, [visionData.images, onNavigate]);

  const getStepText = () => {
    if (!visionData.isLoading) {
      switch (currentStep) {
        case 4:
          return "Complete: All scenes generated successfully";
        case 3:
          return "Ready for Step 3: Generate scene images";  
        case 2:
          return "Ready for Step 2: Create story scenes";
        default:
          return "Ready for Step 1: Extract vision elements";
      }
    }

    // Active processing states  
    switch (currentStep) {
      case 4:
        return "Complete: All scenes generated successfully";
      case 3:
        return "Step 3 of 3: Generating scene images...";
      case 2:
        return "Step 2 of 3: Creating story scenes...";
      default:
        return "Step 1 of 3: Extracting vision elements...";
    }
  };

  const getLoadingText = () => {
    const imageCount = visionData.images?.length || 0;
    const sceneCount = visionData.scenes?.length || 0;
    
    if (!visionData.isLoading) {
      if (progress === 100) return "✨ Scenes complete! Ready to view storyboard";
      if (currentStep === 3) return `💭 Ready to generate images (${imageCount}/${sceneCount} complete)`;
      if (currentStep > 1) return "💭 Ready to continue processing...";
      return "💡 Ready to analyze your vision";
    }
    
    // Active processing states
    if (progress === 100) return "✨ Scenes ready! Redirecting to storyboard...";
    if (currentStep === 3) return `🎨 Painting your dream scenes... (${imageCount}/${sceneCount} ready)`;
    if (currentStep === 2) return "📝 Crafting compelling story moments...";
    return "🔍 Analyzing your vision...";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 20%, rgba(168,139,250,0.25), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(244,114,182,0.25), transparent 40%),
          linear-gradient(135deg, #f5f3ff, #fdf4ff)
        `,
        pt: 6,
      }}
    >
      <Container maxWidth="sm" sx={{ pb: 14 }}>

        {/* ================= HEADER ================= */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Generating Scenes ✨
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
            Crafting your vision based on your prompt
          </Typography>
        </Box>

        {/* ================= PROGRESS ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            mb: 3,
            background: "rgba(255,255,255,0.8)",
          }}
        >
          <Typography fontWeight={600} mb={1}>
            {getStepText()}
          </Typography>

          <LinearProgress
            variant={visionData.isLoading ? (progress > 0 ? "determinate" : "indeterminate") : "determinate"}
            value={progress}
            sx={{
              height: 8,
              borderRadius: 5,
              backgroundColor: "#ede9fe",
              "& .MuiLinearProgress-bar": {
                background:
                  "linear-gradient(90deg,#a78bfa,#ec4899)",
              },
            }}
          />
          
          {progress > 0 && (
            <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
              {progress}% Complete
            </Typography>
          )}
        </Paper>

        {/* ================= PROMPT CARD ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            mb: 3,
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight={600} mb={1}>
            💡 Your Vision
          </Typography>

          {visionData.title && (
            <Typography fontWeight={600} mb={1}>
              {visionData.title}
            </Typography>
          )}

          {visionData.description && (
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
              {visionData.description}
            </Typography>
          )}

          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Duration: {visionData.duration}s
            {visionData.selectedImages && visionData.selectedImages.length > 0 && 
              ` • ${visionData.selectedImages.length} reference image${visionData.selectedImages.length > 1 ? 's' : ''}`
            }
          </Typography>
        </Paper>

        {/* ================= EXTRACTED ELEMENTS ================= */}
        {visionData.elements && (
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              mb: 3,
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <Typography fontWeight={600} mb={2}>
              🎯 Extracted Elements
            </Typography>
            
            {visionData.elements.theme && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} color="primary">
                  Theme: {visionData.elements.theme}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '12px' }}>
              {visionData.elements.career && visionData.elements.career.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={600}>💼 Career:</Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    {visionData.elements.career.slice(0, 3).join(', ')}
                    {visionData.elements.career.length > 3 && '...'}
                  </Typography>
                </Box>
              )}
              {visionData.elements.lifestyle && visionData.elements.lifestyle.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={600}>🎨 Lifestyle:</Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    {visionData.elements.lifestyle.slice(0, 3).join(', ')}
                    {visionData.elements.lifestyle.length > 3 && '...'}
                  </Typography>
                </Box>
              )}
              {visionData.elements.emotions && visionData.elements.emotions.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={600}>😊 Emotions:</Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    {visionData.elements.emotions.slice(0, 3).join(', ')}
                    {visionData.elements.emotions.length > 3 && '...'}
                  </Typography>
                </Box>
              )}
              {visionData.elements.environment && visionData.elements.environment.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={600}>🌍 Environment:</Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    {visionData.elements.environment.slice(0, 3).join(', ')}
                    {visionData.elements.environment.length > 3 && '...'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* ================= SCENE PREVIEWS ================= */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mb: 3,
          }}
        >
          {(visionData.scenes || [1, 2, 3]).map((scene, index) => {
            const item = typeof scene === 'object' ? scene.scene_id : (index + 1);
            const sceneData = typeof scene === 'object' ? scene : visionData.scenes?.[index];
            const sceneImage = visionData.images?.find(img => img.scene_id === item)?.image_path;
            const hasSceneData = Boolean(sceneData);
            const isImageGenerating = hasSceneData && !sceneImage && currentStep >= 3;
            const isImageReady = Boolean(sceneImage);
            
            return (
              <Paper
                key={`scene-${item}`}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  position: "relative",
                  background: isImageReady
                    ? "rgba(255,255,255,0.95)"
                    : hasSceneData
                    ? "rgba(255,255,255,0.9)"
                    : currentStep > 1
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.5)",
                  border: isImageReady
                    ? "2px solid #10b981"
                    : hasSceneData
                    ? "2px solid #3b82f6"
                    : "1px solid #e5e7eb",
                  opacity: currentStep >= 2 ? 1 : 0.5,
                  transition: "all 0.3s ease",
                }}
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  {/* Image Preview/Placeholder */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      background: !isImageReady
                        ? isImageGenerating
                          ? "linear-gradient(45deg, #f3f4f6, #e5e7eb)"
                          : hasSceneData
                          ? "linear-gradient(135deg, #ddd6fe, #c4b5fd)"
                          : "linear-gradient(135deg, #e9d5ff, #fbcfe8)"
                        : "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Actual Image Element */}
                    {isImageReady && (
                      <img
                        src={sceneImage}
                        alt={sceneData?.title || `Scene ${item}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          showSnackbar('Failed to load a scene image', 'error');
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => showSnackbar('Scene image loaded', 'success')}
                      />
                    )}
                    {/* Scene Number Badge */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {item}
                    </Box>

                    {/* Image Generation Spinner */}
                    {isImageGenerating && (
                      <Box
                        sx={{
                          color: "#6b7280",
                          fontSize: 12,
                          textAlign: "center",
                          animation: "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%, 100%": { opacity: 1 },
                            "50%": { opacity: 0.5 },
                          },
                        }}
                      >
                        🎨
                      </Box>
                    )}

                    {/* Status Badge */}
                    {isImageReady && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: "#10b981",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>

                  {/* Scene Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {hasSceneData ? (
                      <>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{
                            color: "#1f2937",
                            mb: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sceneData.title || `Scene ${item}`}
                        </Typography>
                        
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#6b7280",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.3,
                            mb: 1,
                          }}
                        >
                          {sceneData.visual || sceneData.description || "Scene details"}
                        </Typography>

                        {/* Environment Badge */}
                        {sceneData.environment && (
                          <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600, mb: 0.5 }}>
                            📍 {sceneData.environment}
                          </Typography>
                        )}

                        {/* Rich Scene Metadata */}
                        {(sceneData.mood || sceneData.environment || sceneData.camera) && (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                            {sceneData.mood && (
                              <Box
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 1,
                                  bgcolor: "#fef3c7",
                                  color: "#d97706",
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              >
                                😊 {sceneData.mood}
                              </Box>
                            )}
                            {sceneData.camera && (
                              <Box
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 1,
                                  bgcolor: "#e0e7ff",
                                  color: "#4338ca",
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              >
                                📷 {sceneData.camera}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Scene Status */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: isImageReady
                                ? "#dcfce7"
                                : isImageGenerating
                                ? "#fef3c7"
                                : "#e0e7ff",
                              color: isImageReady
                                ? "#16a34a"
                                : isImageGenerating
                                ? "#d97706"
                                : "#4338ca",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {isImageReady
                              ? "READY"
                              : isImageGenerating
                              ? "GENERATING"
                              : "PLANNING"}
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ py: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "#9ca3af", mb: 0.5 }}
                        >
                          Scene {item}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#d1d5db" }}>
                          {currentStep > 1 ? "Generating scene details..." : "Waiting to start"}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* ================= DEBUG INFO (Development Only) ================= */}
        {import.meta.env.DEV && (
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              mb: 3,
              background: "rgba(255,249,196,0.8)",
              border: "1px solid #fbbf24",
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography fontWeight={600} color="#92400e">
                🔍 Debug Info (Dev Only)
              </Typography>
              
              <Button 
                size="small" 
                variant="outlined" 
                onClick={loadMockData}
                sx={{ fontSize: 10, py: 0.5, mr: 1 }}
              >
                Load Mock Data
              </Button>

              {visionData.scenes && visionData.scenes.length > 0 && (!visionData.images || visionData.images.length === 0) && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    showSnackbar(`Scenes: ${visionData.scenes?.length ?? 0} | Images: ${visionData.images?.length ?? 0} | Loading: ${visionData.isLoading ? 'Yes' : 'No'}`, 'info');
                  }}
                  sx={{ fontSize: 10, py: 0.5 }}
                >
                  Debug State
                </Button>
              )}
            </Box>
            
            <Box sx={{ fontSize: 11, fontFamily: 'monospace' }}>
              <Typography variant="caption" display="block">
                Current Step: {currentStep} | Progress: {progress}% | Loading: {visionData.isLoading ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="caption" display="block" mt={1}>
                Elements: {visionData.elements ? '✅ Received' : '❌ Not received'}
              </Typography>
              
              <Typography variant="caption" display="block">
                Scenes: {visionData.scenes ? `✅ ${visionData.scenes.length} scenes` : '❌ Not received'}
              </Typography>
              
              <Typography variant="caption" display="block">
                Images: {visionData.images ? `✅ ${visionData.images.length} images` : '❌ Not received'}
              </Typography>

              {visionData.images && visionData.images.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" fontWeight={600}>Images Details:</Typography>
                  {visionData.images.map((img, i) => (
                    <Box key={i}>
                      <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                        Scene {img.scene_id}: {img.image_path ? '✅ Has URL' : '❌ No URL'}
                      </Typography>
                      {img.image_path && (
                        <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all', fontSize: 9, opacity: 0.7 }}>
                          {img.image_path}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {visionData.scenes && visionData.scenes.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" fontWeight={600}>Scene IDs:</Typography>
                  <Typography variant="caption" display="block">
                    {visionData.scenes.map(s => s.scene_id).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* ================= LOADING ================= */}
        <Box textAlign="center">
          <Typography sx={{ opacity: 0.7, mb: 2 }}>
            {getLoadingText()}
          </Typography>

          {/* Show spinner only when loading */}
          {visionData.isLoading && progress < 100 && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                mx: "auto",
                border: "4px solid #e9d5ff",
                borderTop: "4px solid #a78bfa",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          )}

          {/* Success indicator and manual navigation when complete */}
          {progress === 100 && (
            <Box>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  mx: "auto",
                  bgcolor: "#10b981",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  mb: 2,
                }}
              >
                ✓
              </Box>
              
              <Button
                variant="contained"
                onClick={() => onNavigate(3)}
                sx={{
                  background: "linear-gradient(90deg, #a78bfa, #ec4899)",
                  color: "white",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  "&:hover": {
                    background: "linear-gradient(90deg, #9333ea, #db2777)",
                  },
                }}
              >
                View Storyboard →
              </Button>
            </Box>
          )}

          {/* Show error state if exists */}
          {visionData.error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {visionData.error}
            </Typography>
          )}
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 5000 : 3000}
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