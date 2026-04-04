import { Box, Container, Typography, Paper, Button } from "@mui/material";
import { useState, useEffect } from "react";
import api from "../api/axios";
import SceneCard from "../components/SceneCard";
import VisionProvider from "../context/VisionContext";

const useVision = VisionProvider.useVision;

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
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);


  // Fetch all projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRes = await api.get("/projects");
        setProjects(projectsRes.data);
        // Auto-select the latest project if none selected
        if (projectsRes.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsRes.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
    // eslint-disable-next-line
  }, []);

  // Fetch scenes, images, and videos for a project
  const fetchScenesAndImages = async (projectId) => {
    const pid = projectId || selectedProjectId;
    if (!pid) return;
    try {
      const [scenesRes, imagesRes, videosRes] = await Promise.all([
        api.get(`/projects/${pid}/scenes`),
        api.get(`/projects/${pid}/images`),
        api.get(`/projects/${pid}/scene-videos`)
      ]);
      updateVisionData({
        scenes: scenesRes.data,
        images: imagesRes.data,
        videos: videosRes.data,
      });
    } catch (err) {
      console.error("Failed to fetch scenes/images/videos", err);
    }
  };

  // Fetch scenes and images when selectedProjectId changes
  useEffect(() => {
    fetchScenesAndImages(selectedProjectId);
    // eslint-disable-next-line
  }, [selectedProjectId]);
  
  // Helper to update video state for a specific scene
  const updateVideoState = (sceneId, patch) => {
    setVideoStates(prev => ({ 
      ...prev, 
      [sceneId]: { ...(prev[sceneId] || {}), ...patch } 
    }));
  };

  // Handle scene changes (editing) — only updates local state
  const handleSceneChange = (updatedScene) => {
    const updatedScenes = scenes.map(scene =>
      scene.scene_id === updatedScene.scene_id ? updatedScene : scene
    );
    updateVisionData({ scenes: updatedScenes });
  };

  // Poll video status until completion
  const pollVideoStatus = async (taskId, sceneId, videoId) => {
    try {
      const url = `/video-status/${taskId}?sceneId=${sceneId}${videoId ? `&videoId=${videoId}` : ''}`;
      const response = await api.get(url);
      const { status, videoUrl, error: taskError } = response.data;
      updateVideoState(sceneId, { 
        status, 
        videoUrl: videoUrl || null, 
        error: taskError || null 
      });

      // Continue polling if still processing
      if (["PENDING", "RUNNING", "PROCESSING"].includes(status)) {
        setTimeout(() => pollVideoStatus(taskId, sceneId, videoId), 3000);
      } else if (status === "SUCCEEDED" && videoUrl) {
        // Update the videos in context when completed
        const updatedVideos = visionData.videos 
          ? [...visionData.videos.filter(v => v.sceneId !== sceneId && v._id !== videoId), { sceneId, url: videoUrl }]
          : [{ sceneId, url: videoUrl }];
        updateVisionData({ videos: updatedVideos });
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
      } else if (status === "FAILED") {
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
      }
    } catch (error) {
      console.error("Error polling video status:", error);
      updateVideoState(sceneId, { error: error.message });
      setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
    }
  };

  // API call to regenerate image for a scene
  const handleRegenerateImage = async (scene) => {
    const sceneId = scene.scene_id;
    setLoadingStates(prev => ({ ...prev, [`regen_${sceneId}`]: true }));
    try {
      // Persist any local scene edits before regenerating
      await api.put(`/projects/${selectedProjectId}/scenes/${sceneId}`, {
        title: scene.title,
        visual: scene.visual,
        environment: scene.environment,
        actions: scene.actions,
        mood: scene.mood,
        camera: scene.camera,
        voiceover: scene.voiceover,
      });
      await api.post("/regenerate-image", { scene });
      // Refresh scenes and images after regeneration
      await fetchScenesAndImages();
      setLoadingStates(prev => ({ ...prev, [`regen_${sceneId}`]: false }));
    } catch (error) {
      console.error('Error regenerating image:', error);
      setLoadingStates(prev => ({ ...prev, [`regen_${sceneId}`]: false }));
      alert('Error regenerating image. Please try again.');
    }
  };

  // Save scene edits without regenerating
  const handleSaveScene = async (scene) => {
    const sceneId = scene.scene_id;
    setLoadingStates(prev => ({ ...prev, [`save_${sceneId}`]: true }));
    try {
      await api.put(`/projects/${selectedProjectId}/scenes/${sceneId}`, {
        title: scene.title,
        visual: scene.visual,
        environment: scene.environment,
        actions: scene.actions,
        mood: scene.mood,
        camera: scene.camera,
        voiceover: scene.voiceover,
      });
    } catch (error) {
      console.error('Error saving scene:', error);
      alert('Failed to save scene. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`save_${sceneId}`]: false }));
    }
  };

  // API call to generate video for a scene
  const handleGenerateVideo = async (scene, imagePath) => {
    const sceneId = scene.scene_id;
    setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: true }));
    updateVideoState(sceneId, { status: 'STARTING', videoUrl: null, error: null });
    try {
      const response = await api.post("/generate-video", {
        imageUrl: imagePath,
        scene: scene
      });
      const data = response.data;
      // Check if we got a taskId (async) or immediate result
      if (data.taskId) {
        // Start polling for video completion, pass videoId to update DB
        updateVideoState(sceneId, { taskId: data.taskId, status: 'PENDING' });
        pollVideoStatus(data.taskId, sceneId, data.videoId);
      } else {
        // Handle immediate result (fallback)
        setLoadingStates(prev => ({ ...prev, [`video_${sceneId}`]: false }));
        if (data.videoUrl) {
          const updatedVideos = visionData.videos 
            ? [...visionData.videos.filter(v => v.sceneId !== sceneId), { sceneId, url: data.videoUrl }]
            : [{ sceneId, url: data.videoUrl }];
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

  // Allow user to select a previous scene video as active
  const handleSelectVideo = async (scene, videoId) => {
    try {
      await api.put(`/projects/${selectedProjectId}/scenes/${scene.scene_id}/select-video`, { videoId });
      // Optimistically update local videos state
      const updatedVideos = videos.map(v => {
        if (String(v.sceneId) !== String(scene.scene_id)) return v;
        return { ...v, isLatest: String(v._id) === String(videoId) };
      });
      updateVisionData({ videos: updatedVideos });
    } catch (err) {
      console.error('Failed to select video:', err);
    }
  };

  // Allow user to select a previously generated image as default
  const handleSelectImage = async (scene, imageId) => {
    try {
      await api.put(`/projects/${selectedProjectId}/scenes/${scene.scene_id}/select-image`, { imageId });
      // Optimistically update local images state
      const updatedImages = images.map(img => {
        if (String(img.scene_id) !== String(scene.scene_id)) return img;
        const updatedList = img.images.map(i => ({ ...i, isDefault: String(i._id) === String(imageId) }));
        const newDefault = updatedList.find(i => i.isDefault);
        return { ...img, images: updatedList, image_path: newDefault?.url || img.image_path };
      });
      updateVisionData({ images: updatedImages });
    } catch (err) {
      console.error('Failed to select image:', err);
    }
  };

  // API call to create final stitched video
  const handleCreateFinalVideo = async () => {
    setCreatingFinalVideo(true);
    try {
      const response = await api.post("/stitch-videos", {
        projectId: selectedProjectId,
        scenes,
        videos: visionData.videos || [],
        duration: visionData.duration || 30,
        title: visionData.title || 'My Vision Video',
        theme: visionData.elements?.theme,
      });
      const data = response.data;
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

          {/* Project selection dropdown */}
          {projects.length > 1 && (
            <Box mt={2} display="flex" justifyContent="center">
              <Box sx={{ width: '100%', maxWidth: 600 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Select a Project:
                </Typography>
                <select
                  value={selectedProjectId || ''}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    fontSize: 16,
                    border: '1.5px solid #e5e7eb',
                    background: '#fafaff',
                    boxSizing: 'border-box',
                  }}
                >
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.title || 'Untitled'} ({new Date(project.createdAt).toLocaleString()})
                    </option>
                  ))}
                </select>
              </Box>
            </Box>
          )}
        </Box>

        {/* ================= SCENES ================= */}
        {scenes.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {scenes.map((scene, index) => {
              const image = images.find(
                (img) => img.scene_id === scene.scene_id
              );
              // All video versions for this scene, newest first
              const sceneVideos = videos
                .filter((vid) => String(vid.sceneId) === String(scene.scene_id))
                .sort((a, b) => (b.version || 0) - (a.version || 0));
              // Active video = isLatest flag, fall back to first
              const video = sceneVideos.find(v => v.isLatest) || sceneVideos[0] || null;
              const videoState = videoStates[scene.scene_id] || {};
              const isGeneratingVideo = ['STARTING', 'PENDING', 'RUNNING', 'PROCESSING'].includes(videoState.status) || loadingStates[`video_${scene.scene_id}`];

              return (
                <SceneCard
                  key={scene.scene_id}
                  index={index}
                  scene={scene}
                  image={image}
                  video={video}
                  allVideos={sceneVideos}
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
                  onSave={() => handleSaveScene(scene)}
                  isSaving={loadingStates[`save_${scene.scene_id}`]}
                  onSelectImage={(imageId) => handleSelectImage(scene, imageId)}
                  onSelectVideo={(videoId) => handleSelectVideo(scene, videoId)}
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