import {
  Paper, Typography, Box, Card, CardContent, Grid,
  TextField, Select, MenuItem, Button, CircularProgress,
  Chip, Fade, LinearProgress, Stack,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Visibility, Landscape, DirectionsRun, Mood, Videocam, RecordVoiceOver
} from '@mui/icons-material';

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
  const detailIcons = {
    Visual: <Visibility sx={{ fontSize: 15, color: 'primary.main' }} />,
    Environment: <Landscape sx={{ fontSize: 15, color: 'success.main' }} />,
    Actions: <DirectionsRun sx={{ fontSize: 15, color: 'warning.main' }} />,
    Mood: <Mood sx={{ fontSize: 15, color: 'error.main' }} />,
    Camera: <Videocam sx={{ fontSize: 15, color: 'secondary.main' }} />,
  };

  const imageCount = images?.length || 0;
  const sceneCount = scenes?.length || 0;
  const allImagesLoaded = imageCount >= sceneCount;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6">
            🎬 Generated Scenes
          </Typography>
          {totalScenes && (
            <Chip
              label={`${imageCount} / ${totalScenes} images`}
              size="small"
              color={allImagesLoaded ? 'success' : 'default'}
              variant={allImagesLoaded ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* Image loading progress */}
      {totalScenes && !allImagesLoaded && (
        <Box sx={{ mb: 2.5 }}>
          <LinearProgress
            variant="determinate"
            value={(imageCount / totalScenes) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: 3,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Generating images... {imageCount} of {totalScenes} ready
          </Typography>
        </Box>
      )}

      {/* Scene cards grid */}
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {scenes.map((scene) => {
          let imagePath = null;
          if (images && Array.isArray(images)) {
            const found = images.find((img) => img.scene_id === scene.scene_id);
            if (found?.image_path) {
              imagePath = found.image_path.startsWith('images/') ? `/${found.image_path}` : found.image_path;
            }
          }
          const original = originalScenes.find((s) => s.scene_id === scene.scene_id);
          const isDirty = original && JSON.stringify(original) !== JSON.stringify(scene);
          const isRegenerating = regeneratingIds.includes(scene.scene_id);
          const video = videoState[scene.scene_id] || {};
          const isGeneratingVideo = ['STARTING', 'PENDING', 'RUNNING', 'PROCESSING'].includes(video.status);

          return (
            <Grid item xs={12} sm={6} lg={4} key={scene.scene_id}>
              <Fade in timeout={400 + scene.scene_id * 100}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
                    {/* Scene badge + title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={scene.scene_id}
                        size="small"
                        sx={{
                          minWidth: 28,
                          height: 28,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: '#fff',
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', lineHeight: 1.3, fontWeight: 600 }}>
                        {scene.title}
                      </Typography>
                    </Box>

                    {/* Scene image — preserves full aspect ratio, no cropping */}
                    {imagePath ? (
                      <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <img
                          src={imagePath}
                          alt={`Scene ${scene.scene_id}`}
                          style={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'contain',
                            display: 'block',
                            backgroundColor: '#f9f9fb',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mb: 2,
                          height: 180,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                          border: '1px dashed',
                          borderColor: 'grey.300',
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <CircularProgress size={24} sx={{ mb: 1 }} />
                          <Typography variant="caption" color="text.secondary" display="block">
                            Generating image...
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Detail fields */}
                    <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                      {[
                        { label: 'Visual', value: scene.visual, field: 'visual' },
                        { label: 'Environment', value: scene.environment, field: 'environment', select: true, selectKey: 'environment' },
                        { label: 'Actions', value: scene.actions, field: 'actions' },
                        { label: 'Mood', value: scene.mood, field: 'mood', select: true, selectKey: 'emotions' },
                        { label: 'Camera', value: scene.camera },
                      ].map((detail, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 88, flexShrink: 0, pt: 0.3 }}>
                            {detailIcons[detail.label]}
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                              {detail.label}
                            </Typography>
                          </Box>
                          {detail.field && detail.select ? (
                            <Select
                              value={detail.value || ''}
                              onChange={(e) => {
                                if (!setScenes) return;
                                setScenes(scenes.map((s) => (s.scene_id === scene.scene_id ? { ...s, [detail.field]: e.target.value } : s)));
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
                                setScenes(scenes.map((s) => (s.scene_id === scene.scene_id ? { ...s, [detail.field]: e.target.value } : s)));
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

                    {/* Voiceover */}
                    {scene.voiceover && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1.5,
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                          borderLeft: 3,
                          borderColor: 'secondary.main',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <RecordVoiceOver sx={{ fontSize: 14, color: 'secondary.main' }} />
                          <Typography variant="caption" fontWeight={700} color="secondary" sx={{ fontSize: '0.7rem' }}>
                            Voiceover
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                          {scene.voiceover}
                        </Typography>
                      </Box>
                    )}

                    {/* Action buttons */}
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {/* Generate Video + Voice */}
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        fullWidth
                        startIcon={isGeneratingVideo ? <CircularProgress size={14} color="inherit" /> : <RecordVoiceOver fontSize="small" />}
                        onClick={() => onGenerateVideo && onGenerateVideo(scene, imagePath)}
                        disabled={isGeneratingVideo || !imagePath}
                      >
                        {isGeneratingVideo
                          ? `Generating... (${video.status})`
                          : video.videoUrl
                            ? 'Regenerate Video + Voice'
                            : '🎬 Generate Video + Voice'}
                      </Button>

                      {/* Regenerate Image + Reset */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={isRegenerating ? <CircularProgress size={14} /> : <AutorenewIcon fontSize="small" />}
                          onClick={() => onRegenerateImage && onRegenerateImage(scene)}
                          disabled={!isDirty || isRegenerating}
                          sx={{ flex: 1 }}
                        >
                          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<RestartAltIcon fontSize="small" />}
                          onClick={() => {
                            if (!original || !setScenes) return;
                            setScenes(scenes.map((s) => (s.scene_id === scene.scene_id ? { ...original } : s)));
                          }}
                          disabled={!isDirty}
                          color="inherit"
                          sx={{ minWidth: 'auto', color: 'text.secondary' }}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Stack>

                    {/* Video error */}
                    {video.status === 'FAILED' && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                        {video.error || 'Video generation failed'}
                      </Typography>
                    )}

                    {/* Video player */}
                    {video.videoUrl && (
                      <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#000' }}>
                          <video
                            key={video.videoUrl}
                            src={video.videoUrl}
                            controls
                            loop
                            style={{ width: '75%', display: 'block', height: 'auto' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, py: 0.5, bgcolor: 'grey.50' }}>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                            component="a"
                            href={video.videoUrl}
                            download={`scene-${scene.scene_id}-video.mp4`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: 0 }}
                          >
                            Download
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
