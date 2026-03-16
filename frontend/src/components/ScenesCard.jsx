import { useState } from 'react';
import {
  Paper, Typography, Box, Card, CardContent, Grid,
  TextField, Select, MenuItem, Button, CircularProgress,
  Chip, Fade, LinearProgress, Stack, ToggleButtonGroup, ToggleButton, Divider,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SyncIcon from '@mui/icons-material/Sync';
import {
  Visibility, Landscape, DirectionsRun, Mood, Videocam, RecordVoiceOver,
} from '@mui/icons-material';

const glassCard = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '20px',
};

const gradientBtn = {
  background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)',
  color: '#fff',
  fontWeight: 700,
  borderRadius: 3,
  textTransform: 'none',
  boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  '&:hover': { background: 'linear-gradient(90deg,#5b5ff0,#7c3aed,#db2777)' },
  '&:disabled': { opacity: 0.5, color: '#fff' },
};

const StatusDot = ({ done, spinning, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {spinning ? (
      <SyncIcon sx={{ fontSize: 15, color: '#8b5cf6', animation: 'spin 1.2s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
    ) : done ? (
      <CheckCircleIcon sx={{ fontSize: 15, color: '#34d399' }} />
    ) : (
      <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.25)' }} />
    )}
    <Typography variant="caption" sx={{ fontSize: '0.72rem', color: done || spinning ? 'text.primary' : 'text.disabled' }}>
      {label}
    </Typography>
  </Box>
);

export default function ScenesCard({
  scenes,
  setScenes,
  images,
  elements,
  originalScenes = [],
  onRegenerateImage,
  regeneratingIds = [],
  videoState = {},
  onGenerateVideo,
  totalScenes = null,
}) {
  const [activeSceneId, setActiveSceneId] = useState(scenes?.[0]?.scene_id ?? null);
  const detailIcons = {
    Visual: <Visibility sx={{ fontSize: 14, color: '#a78bfa' }} />,
    Environment: <Landscape sx={{ fontSize: 14, color: '#34d399' }} />,
    Actions: <DirectionsRun sx={{ fontSize: 14, color: '#fbbf24' }} />,
    Mood: <Mood sx={{ fontSize: 14, color: '#f87171' }} />,
    Camera: <Videocam sx={{ fontSize: 14, color: '#60a5fa' }} />,
  };

  const imageCount = images?.length || 0;
  const sceneCount = scenes?.length || 0;
  const allImagesLoaded = imageCount >= sceneCount;
  const videoCount = Object.values(videoState).filter((v) => v.videoUrl).length;
  const allVideosGenerated = videoCount > 0 && videoCount >= sceneCount;

  const getImagePath = (sceneId) => {
    if (!images || !Array.isArray(images)) return null;
    const found = images.find((img) => img.scene_id === sceneId);
    if (!found?.image_path) return null;
    return found.image_path.startsWith('images/') ? `/${found.image_path}` : found.image_path;
  };

  const activeScene = scenes.find((s) => s.scene_id === activeSceneId) || scenes[0];
  const activeImagePath = activeScene ? getImagePath(activeScene.scene_id) : null;
  const activeVideo = activeScene ? (videoState[activeScene.scene_id] || {}) : {};
  const isGeneratingVideo = ['STARTING', 'PENDING', 'RUNNING', 'PROCESSING'].includes(activeVideo.status);
  const isRegenerating = activeScene ? regeneratingIds.includes(activeScene.scene_id) : false;
  const original = activeScene ? originalScenes.find((s) => s.scene_id === activeScene.scene_id) : null;
  const isDirty = original && JSON.stringify(original) !== JSON.stringify(activeScene);

  return (
    <Paper sx={{ ...glassCard, p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          🎬 Generated Scenes
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {totalScenes && (
            <Chip
              label={`🖼️ ${imageCount} / ${totalScenes} images`}
              size="small"
              sx={{
                fontWeight: 600,
                background: allImagesLoaded
                  ? 'linear-gradient(90deg,#34d399,#059669)'
                  : 'rgba(255,255,255,0.08)',
                color: allImagesLoaded ? '#fff' : 'text.secondary',
                border: allImagesLoaded ? 'none' : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          )}
          <Chip
            label={`▶ ${videoCount} / ${sceneCount} videos`}
            size="small"
            sx={{
              fontWeight: 600,
              background: allVideosGenerated
                ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                : videoCount > 0
                  ? 'rgba(99,102,241,0.2)'
                  : 'rgba(255,255,255,0.08)',
              color: allVideosGenerated ? '#fff' : videoCount > 0 ? '#a78bfa' : 'text.secondary',
              border: allVideosGenerated ? 'none' : videoCount > 0 ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.15)',
            }}
          />
        </Box>
      </Box>

      {/* ── Progress bar ── */}
      {totalScenes && !allImagesLoaded && (
        <Box sx={{ mb: 2.5, px: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(imageCount / totalScenes) * 100}
            sx={{
              height: 5,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg,#6366f1,#ec4899)',
                borderRadius: 3,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center', fontSize: '0.7rem' }}>
            Generating images… {imageCount} of {totalScenes}
          </Typography>
        </Box>
      )}

      {/* ── Timeline strip ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1.5,
          mb: 2.5,
          px: 0.5,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(139,92,246,0.6)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(139,92,246,0.9)' } },
        }}
      >
        {scenes.map((scene) => {
          const thumb = getImagePath(scene.scene_id);
          const isActive = scene.scene_id === (activeScene?.scene_id);
          const vid = videoState[scene.scene_id] || {};
          return (
            <Box
              key={scene.scene_id}
              onClick={() => setActiveSceneId(scene.scene_id)}
              sx={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: 120,
                cursor: 'pointer',
                borderRadius: 2.5,
                overflow: 'hidden',
                border: isActive ? '2px solid #8b5cf6' : vid.videoUrl ? '2px solid #34d399' : '2px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(139,92,246,0.55)' : vid.videoUrl ? '0 0 12px rgba(52,211,153,0.4)' : 'none',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'rgba(139,92,246,0.6)' },
              }}
            >
              {/* Thumbnail image */}
              <Box
                sx={{
                  height: 80,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {thumb ? (
                  <img src={thumb} alt={`Scene ${scene.scene_id}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.3)' }} />
                )}
                {/* Scene number badge */}
                <Box sx={{
                  position: 'absolute', top: 5, left: 5,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {scene.scene_id}
                  </Typography>
                </Box>
                {/* Regenerating overlay */}
                {regeneratingIds.includes(scene.scene_id) && (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} sx={{ color: '#8b5cf6' }} />
                  </Box>
                )}
                {/* Video ready badge */}
                {vid.videoUrl && (
                  <Box sx={{ position: 'absolute', top: 5, right: 5, bgcolor: '#34d399', borderRadius: 1, px: 0.5, py: 0.2, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#000', lineHeight: 1 }}>▶ VID</Typography>
                  </Box>
                )}
              </Box>
              {/* Title label */}
              <Box sx={{ bgcolor: isActive ? 'rgba(139,92,246,0.55)' : 'rgba(0,0,0,0.55)', px: 1, py: 0.75 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: isActive ? '0 1px 4px rgba(0,0,0,0.6)' : 'none' }}>
                  {scene.title}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── Main content ── */}
      {activeScene && (
        <Grid container spacing={2.5}>

          {/* ── LEFT: Scene Preview Card ── */}
          <Grid item xs={12} md={8}>
            <Fade in key={activeScene.scene_id} timeout={300}>
              <Box sx={{ ...glassCard, p: 2.5, height: '100%' }}>

                {/* Scene badge + title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                  <Chip
                    label={activeScene.scene_id}
                    size="small"
                    sx={{
                      minWidth: 30,
                      height: 30,
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: '#fff',
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {activeScene.title}
                  </Typography>
                </Box>

                {/* Metadata (left) + Image & actions (right) */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>

                  {/* Left: Scene metadata */}
                  <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                    {[
                      { label: 'Visual', value: activeScene.visual, field: 'visual' },
                      { label: 'Environment', value: activeScene.environment, field: 'environment', select: true, selectKey: 'environment' },
                      { label: 'Actions', value: activeScene.actions, field: 'actions' },
                      { label: 'Mood', value: activeScene.mood, field: 'mood', select: true, selectKey: 'emotions' },
                      { label: 'Camera', value: activeScene.camera },
                    ].map((detail, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 90, flexShrink: 0, pt: 0.35 }}>
                          {detailIcons[detail.label]}
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            {detail.label}
                          </Typography>
                        </Box>
                        {detail.field && detail.select ? (
                          <Select
                            value={detail.value || ''}
                            onChange={(e) => {
                              if (!setScenes) return;
                              setScenes(scenes.map((s) => (s.scene_id === activeScene.scene_id ? { ...s, [detail.field]: e.target.value } : s)));
                            }}
                            variant="standard"
                            size="small"
                            sx={{ flex: 1, fontSize: '0.75rem' }}
                          >
                            {(elements?.[detail.selectKey] || []).map((opt, i) => (
                              <MenuItem key={i} value={opt} sx={{ fontSize: '0.75rem' }}>{opt}</MenuItem>
                            ))}
                            {detail.value && !(elements?.[detail.selectKey] || []).includes(detail.value) && (
                              <MenuItem value={detail.value} sx={{ fontSize: '0.75rem' }}>{detail.value}</MenuItem>
                            )}
                          </Select>
                        ) : detail.field ? (
                          <TextField
                            value={detail.value || ''}
                            onChange={(e) => {
                              if (!setScenes) return;
                              setScenes(scenes.map((s) => (s.scene_id === activeScene.scene_id ? { ...s, [detail.field]: e.target.value } : s)));
                            }}
                            variant="standard"
                            size="small"
                            multiline
                            sx={{ flex: 1 }}
                            inputProps={{ style: { fontSize: '0.75rem', lineHeight: 1.5 } }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontSize: '0.75rem', lineHeight: 1.5 }}>
                            {detail.value}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  {/* Right: Image + Regenerate/Reset */}
                  <Box sx={{ flexShrink: 0, width: '45%' }}>
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '4/3',
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.10)',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      {activeImagePath ? (
                        <img
                          src={activeImagePath}
                          alt={`Scene ${activeScene.scene_id}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <CircularProgress size={24} sx={{ mb: 0.75, color: '#8b5cf6' }} />
                          <Typography variant="caption" color="text.secondary" display="block">
                            Generating image…
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {/* Regenerate / Reset */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={isRegenerating ? <CircularProgress size={12} /> : <AutorenewIcon sx={{ fontSize: 13 }} />}
                        onClick={() => onRegenerateImage && onRegenerateImage(activeScene)}
                        disabled={!isDirty || isRegenerating}
                        sx={{ fontSize: '0.68rem', borderRadius: 2, textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary', flex: 1, minWidth: 0 }}
                      >
                        {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<RestartAltIcon sx={{ fontSize: 13 }} />}
                        onClick={() => {
                          if (!original || !setScenes) return;
                          setScenes(scenes.map((s) => (s.scene_id === activeScene.scene_id ? { ...original } : s)));
                        }}
                        disabled={!isDirty}
                        sx={{ fontSize: '0.68rem', textTransform: 'none', color: 'text.secondary', minWidth: 'auto' }}
                      >
                        Reset
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Voiceover */}
                {activeScene.voiceover && (
                  <Box
                    sx={{
                      p: 1.5,
                      mb: 2,
                      background: 'rgba(139,92,246,0.08)',
                      borderRadius: 2,
                      borderLeft: '3px solid #8b5cf6',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <RecordVoiceOver sx={{ fontSize: 13, color: '#a78bfa' }} />
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem', color: '#a78bfa' }}>
                        Voiceover
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                      {activeScene.voiceover}
                    </Typography>
                  </Box>
                )}

                {/* Generate Video + Voice */}
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  startIcon={isGeneratingVideo ? <CircularProgress size={14} color="inherit" /> : <RecordVoiceOver fontSize="small" />}
                  onClick={() => onGenerateVideo && onGenerateVideo(activeScene, activeImagePath)}
                  disabled={isGeneratingVideo || !activeImagePath}
                  sx={gradientBtn}
                >
                  {isGeneratingVideo
                    ? `Generating… (${activeVideo.status})`
                    : activeVideo.videoUrl
                      ? 'Regenerate Video + Voice'
                      : '🎬 Generate Video + Voice'}
                </Button>

                {/* Video generating loader */}
                {isGeneratingVideo && (
                  <Fade in>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))',
                        border: '1px solid rgba(139,92,246,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <CircularProgress size={36} thickness={3} sx={{ color: '#8b5cf6' }} />
                        <CircularProgress
                          size={36} thickness={3} variant="determinate" value={100}
                          sx={{ position: 'absolute', top: 0, left: 0, color: 'rgba(139,92,246,0.15)' }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>
                          Video is being generated
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          Status: <Box component="span" sx={{ color: '#a78bfa', fontWeight: 700 }}>{activeVideo.status}</Box> — this may take a minute
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.75,
                            height: 3,
                            borderRadius: 2,
                            bgcolor: 'rgba(139,92,246,0.15)',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: '40%',
                              background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)',
                              borderRadius: 2,
                              animation: 'slideProgress 1.6s ease-in-out infinite',
                              '@keyframes slideProgress': {
                                '0%': { transform: 'translateX(-100%)' },
                                '100%': { transform: 'translateX(300%)' },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Video player */}
                {activeVideo.videoUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ borderRadius: 2.5, overflow: 'hidden', bgcolor: '#000', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video
                        key={activeVideo.videoUrl}
                        src={activeVideo.videoUrl}
                        controls
                        loop
                        style={{ maxWidth: '75%', maxHeight: 280, objectFit: 'contain', display: 'block', backgroundColor: '#000' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.75 }}>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                        component="a"
                        href={activeVideo.videoUrl}
                        download={`scene-${activeScene.scene_id}-video.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ fontSize: '0.7rem', textTransform: 'none', color: 'text.secondary' }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Video error */}
                {activeVideo.status === 'FAILED' && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {activeVideo.error || 'Video generation failed'}
                  </Typography>
                )}
              </Box>
            </Fade>
          </Grid>          

        </Grid>
      )}
    </Paper>
  );
}
