import { Box, Container, Typography, Paper, Button } from "@mui/material";
import { useState } from "react";
import SceneCard from "../components/SceneCard";
import VisionProvider from "../context/VisionContext";

const useVision = VisionProvider.useVision;
const API_URL = import.meta.env.VITE_API_URL || 'https://livya.onrender.com';


export default function Storyboard() {
  const { visionData, updateVisionData } = useVision();
  const [loadingStates, setLoadingStates] = useState({});
  const [creatingFinalVideo, setCreatingFinalVideo] = useState(false);
  const [videoStates, setVideoStates] = useState({}); // Track video generation status per scene
  // Get scenes, images, and videos from context
  const scenes = visionData.scenes || [];
  const images = visionData.images || [];
  const videos = visionData.videos || [];
  const [activeSceneId, setActiveSceneId] = useState(null);
  
  // Helper to update video state for a specific scene
  const updateVideoState = (sceneId, patch) => {
    setVideoStates(prev => ({ 
      ...prev, 
      [sceneId]: { ...(prev[sceneId] || {}), ...patch } 
    }));
  };

  // Handle scene changes (editing)
  const handleSceneChange = (updatedScene) => {
    const updatedScenes = scenes.map(scene => 
      scene.scene_id === updatedScene.scene_id ? updatedScene : scene
    );
    updateVisionData({ scenes: updatedScenes });
  };

  // Poll video status until completion
  const pollVideoStatus = async (taskId, sceneId) => {
    try {
      const response = await fetch(`${API_URL}/video-status/${taskId}?sceneId=${sceneId}`);
      if (!response.ok) throw new Error('Failed to get video status');
      
      const { status, videoUrl, error: taskError } = await response.json();
      
      updateVideoState(sceneId, { 
        status, 
        videoUrl: videoUrl || null, 
        error: taskError || null 
      });

      // Continue polling if still processing
      if (['PENDING', 'RUNNING', 'PROCESSING'].includes(status)) {
        setTimeout(() => pollVideoStatus(taskId, sceneId), 3000);
      } else if (status === 'SUCCEEDED' && videoUrl) {
        // Update the videos in context when completed
        const updatedVideos = visionData.videos 
          ? [...visionData.videos.filter(v => v.scene_id !== sceneId), { scene_id: sceneId, videoUrl }]
          : [{ scene_id: sceneId, videoUrl }];
        updateVisionData({ videos: updatedVideos });
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
      } else if (status === 'FAILED') {
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
      }
    } catch (error) {
      console.error('Error polling video status:', error);
      updateVideoState(sceneId, { error: error.message });
      setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
    }
  };

  // API call to regenerate image for a scene
  const handleRegenerateImage = async (scene) => {
    const sceneId = scene.scene_id;
    setLoadingStates(prev => ({ ...prev, [`regen_${sceneId}`]: true }));
    
    try {
      const response = await fetch(`${API_URL}/regenerate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: scene, // Send the full scene object as expected by backend
          protagonistBase64: null, // Send empty as requested
          protagonistGender: null // Send empty as requested
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const data = await response.json();
      
      // Update the image in context
      const updatedImages = visionData.images?.map(img => 
        img.scene_id === sceneId 
          ? { ...img, image_path: data.image_path }
          : img
      ) || [];

      updateVisionData({ images: updatedImages });
      
    } catch (error) {
      console.error('Error regenerating image:', error);
      alert('Error regenerating image. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`regen_${sceneId}`]: false }));
    }
  };

  // API call to generate video for a scene
  const handleGenerateVideo = async (scene, imagePath) => {
    const sceneId = scene.scene_id;
    setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: true }));
    updateVideoState(sceneId, { status: 'STARTING', videoUrl: null, error: null });
    
    try {
      const response = await fetch(`${API_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imagePath,
          scene: scene
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      
      // Check if we got a taskId (async) or immediate result
      if (data.taskId) {
        // Start polling for video completion
        updateVideoState(sceneId, { taskId: data.taskId, status: 'PENDING' });
        pollVideoStatus(data.taskId, sceneId);
      } else {
        // Handle immediate result (fallback)
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
        if (data.videoUrl) {
          const updatedVideos = visionData.videos 
            ? [...visionData.videos.filter(v => v.scene_id !== sceneId), { scene_id: sceneId, videoUrl: data.video_url }]
            : [{ scene_id: sceneId, videoUrl: data.videoUrl }];
          updateVisionData({ videos: updatedVideos });
        }
      }
      
    } catch (error) {
      console.error('Error generating video:', error);
      updateVideoState(sceneId, { error: error.message });
      setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
      alert('Error generating video. Please try again.');
    }
  };

  // API call to create final stitched video
  const handleCreateFinalVideo = async () => {
    setCreatingFinalVideo(true);
    
    try {
      const response = await fetch(`${API_URL}/stitch-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenes: scenes,
          videos: visionData.videos || [],
          duration: visionData.duration || 30,
          title: visionData.title || 'My Vision Video',
          theme: visionData.elements?.theme
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create final video');
      }

      const data = await response.json();
      
      // Update context with final video URL
      updateVisionData({ 
        finalVideo: {
          url: data.stitchedUrl,
          duration: data.duration,
          created_at: new Date().toISOString()
        }
      });

      alert('Final video created successfully!');
      
    } catch (error) {
      console.error('Error creating final video:', error);
      alert('Error creating final video. Please try again.');
    } finally {
      setCreatingFinalVideo(false);
    }
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
        pt: 4,
      }}
    >
      <Container maxWidth="sm" sx={{ pb: 14 }}>

        {/* ================= HEADER ================= */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Your Storyboard 🎬
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
            Edit and refine your scenes before generating videos
          </Typography>
        </Box>

        {/* ================= SCENES ================= */}
        {scenes.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {scenes.map((scene, index) => {
              const image = images.find(
                (img) => img.scene_id === scene.scene_id
              );
              const video = videos.find(
                (vid) => vid.scene_id === scene.scene_id
              );
              const videoState = videoStates[scene.scene_id] || {};
              const isGeneratingVideo = ['STARTING', 'PENDING', 'RUNNING', 'PROCESSING'].includes(videoState.status) || loadingStates[`video_${scene.scene_id}`];

              return (
                <SceneCard
                  key={scene.scene_id}
                  index={index}
                  scene={scene}
                  image={image}
                  video={video}
                  videoState={videoState}
                  isExpanded={activeSceneId === scene.scene_id}
                  onToggle={() =>
                    setActiveSceneId(
                      activeSceneId === scene.scene_id ? null : scene.scene_id
                    )
                  }
                  onRegenerate={() => handleRegenerateImage(scene)}
                  onGenerateVideo={() =>
                    handleGenerateVideo(scene, image?.image_path)
                  }
                  onSceneChange={handleSceneChange}
                  isRegenerating={loadingStates[`regen_${scene.scene_id}`]}
                  isGeneratingVideo={isGeneratingVideo}
                />
              );
            })}
          </Box>
        ) : (
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: "center",
              background: "rgba(255,255,255,0.9)",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={1} sx={{ opacity: 0.7 }}>
              No Scenes Available
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Generate some scenes first to see your storyboard
            </Typography>
          </Paper>
        )}

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
            <Typography fontWeight={600} mb={1} color="#92400e">
              🔍 StoryBoard Debug Info
            </Typography>
            
            <Box sx={{ fontSize: 11, fontFamily: 'monospace' }}>
              <Typography variant="caption" display="block">
                Scenes: {scenes.length > 0 ? `✅ ${scenes.length} scenes` : '❌ No scenes'}
              </Typography>
              
              <Typography variant="caption" display="block">
                Images: {images.length > 0 ? `✅ ${images.length} images` : '❌ No images'}
              </Typography>

              <Typography variant="caption" display="block">
                Videos: {videos.length > 0 ? `✅ ${videos.length} videos` : '❌ No videos'}
              </Typography>

              {scenes.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" fontWeight={600}>Scene Titles:</Typography>
                  {scenes.slice(0, 3).map((scene, i) => (
                    <Typography key={i} variant="caption" display="block">
                      {i + 1}. {scene.title}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* ================= FINAL CTA ================= */}
        <Paper
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 4,
            textAlign: "center",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight={600} mb={1}>
            Ready to create your vision reel?
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
            {visionData.videos && visionData.videos.length > 0 
              ? `${visionData.videos.length} videos ready` 
              : 'Generate scene videos first'}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateFinalVideo}
            disabled={!visionData.videos || visionData.videos.length === 0 || creatingFinalVideo}
            sx={{
              py: 1.4,
              borderRadius: 3,
              fontWeight: 700,
              minHeight: 48,
              background: (!visionData.videos || visionData.videos.length === 0 || creatingFinalVideo)
                ? "#e5e7eb"
                : "linear-gradient(90deg,#a78bfa,#ec4899)",
              color: (!visionData.videos || visionData.videos.length === 0 || creatingFinalVideo) ? "#9ca3af" : "white",
              "&:hover": {
                background: (!visionData.videos || visionData.videos.length === 0 || creatingFinalVideo)
                  ? "#e5e7eb"
                  : "linear-gradient(90deg,#9333ea,#db2777)",
              },
            }}
          >
            {creatingFinalVideo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Creating Final Video...
              </Box>
            ) : (
              '🎥 Create Final Video'
            )}
          </Button>

          {visionData.finalVideo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f0f9ff", borderRadius: 2 }} key={`finalVideo-${visionData.finalVideo.url}`}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" mb={2}>
                ✅ Final Video Ready!
              </Typography>
              
              {/* Video Player */}
              <Box sx={{ mb: 2 }}>
                <video
                  key={`video-${visionData.finalVideo.url}`}
                  controls
                  width="100%"
                  style={{ 
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    backgroundColor: '#000'
                  }}
                >
                  <source key={`source-${visionData.finalVideo.url}`} src={visionData.finalVideo.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>

              {/* Download Button */}
              <Button
                href={visionData.finalVideo.url}
                target="_blank"
                variant="outlined"
                size="small"
                download
              >
                Download Video
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}