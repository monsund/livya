import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import MovieIcon from "@mui/icons-material/Movie";

export default function SceneCard({
  scene,
  image,
  index,
  video,
  allVideos = [],
  videoState = {},
  onRegenerate,
  onGenerateVideo,
  onSceneChange,
  onSave,
  onSelectImage,
  onSelectVideo,
  isRegenerating = false,
  isGeneratingVideo = false,
  isSaving = false,
  isExpanded = false,
  onToggle,
}) {
  const handleFieldChange = (field, value) => {
    if (onSceneChange) {
      onSceneChange({ ...scene, [field]: value });
    }
  };

  /* ================= COLLAPSED VIEW ================= */
  if (!isExpanded) {
    return (
      <Paper
        onClick={onToggle}
        sx={{
          p: 2,
          borderRadius: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          cursor: "pointer",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        {/* Thumbnail */}
        <Box
          sx={{
            width: 80,
            height: 60,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            background: image?.image_path
              ? `url(${image.image_path})`
              : "linear-gradient(135deg,#e9d5ff,#fbcfe8)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Info */}
        <Box
            sx={{
                flex: 1,
                minWidth: 0, // 🔥 CRITICAL FIX
            }}
            >
            <Typography
                fontWeight={600}
                fontSize={14}
                noWrap
            >
                {scene.title || `Scene ${index + 1}`}
            </Typography>

            <Typography
                variant="caption"
                sx={{
                opacity: 0.7,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                }}
            >
                {scene.visual || scene.description || "No description"}
            </Typography>
        </Box>

        {/* Status */}
        <Chip
          label={image?.image_path ? "READY" : "PENDING"}
          size="small"
          color={image?.image_path ? "success" : "default"}
        />
        {/* Video status */}
        {(() => {
          const vs = videoState?.status;
          const hasVideo = video?.url || videoState?.videoUrl;
          const isProcessing = ['STARTING','PENDING','RUNNING','PROCESSING'].includes(vs);
          if (isProcessing) return <Chip label="GENERATING" size="small" color="warning" />;
          if (hasVideo) return <Chip label="VIDEO READY" size="small" color="primary" />;
          return null;
        })()}

        {/* Expand Icon */}
        <Box
          sx={{
            ml: 1,
            color: '#a78bfa',
            fontSize: 22,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
          }}
        >
          ▼
        </Box>
      </Paper>
    );
  }

  /* ================= EXPANDED VIEW ================= */
  return (
    <Paper
      sx={{
        p: 0,
        borderRadius: 4,
        background: "#fff",
        border: image?.image_path ? "2px solid #10b981" : "1px solid #e5e7eb",
        boxShadow: '0 2px 12px rgba(80,80,120,0.06)',
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(90deg,#f5f3ff 60%,#fdf4ff 100%)',
        }}
      >
        <Box>
          <Typography fontWeight={700} fontSize={18} sx={{ mb: 0.5, color: '#312e81' }}>
            {scene.title || `Scene ${index + 1}`}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 13 }}>
            Scene {index + 1}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={image?.image_path ? "READY" : "PENDING"}
            size="small"
            color={image?.image_path ? "success" : "default"}
            sx={{ fontWeight: 600 }}
          />
          {/* Video status chip */}
          {(() => {
            const vs = videoState?.status;
            const hasVideo = video?.url || videoState?.videoUrl;
            const isProcessing = ['STARTING','PENDING','RUNNING','PROCESSING'].includes(vs);
            if (isProcessing) return <Chip label="GENERATING" size="small" color="warning" sx={{ fontWeight: 600 }} />;
            if (hasVideo) return <Chip label="VIDEO READY" size="small" color="primary" sx={{ fontWeight: 600 }} />;
            return <Chip label="NO VIDEO" size="small" variant="outlined" sx={{ fontWeight: 600, opacity: 0.5 }} />;
          })()}
          {/* Collapse */}
          <Typography
            onClick={onToggle}
            sx={{ cursor: "pointer", fontSize: 20, opacity: 0.5, ml: 1, userSelect: 'none' }}
            aria-label="Collapse scene details"
          >
            ▲
          </Typography>
        </Box>
      </Box>

      {/* VISUAL PREVIEW */}
      <Box
        sx={{
          width: '100%',
          aspectRatio: '16/9',
          background: image?.image_path ? `url(${image.image_path})` : "linear-gradient(135deg,#e9d5ff,#fbcfe8)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: '1px solid #f3f4f6',
        }}
      />

      {/* IMAGE HISTORY STRIP */}
      {image?.images?.length > 1 && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #f3f4f6',
            background: '#fafaff',
          }}
        >
          <Typography fontSize={12} fontWeight={600} sx={{ mb: 1, color: '#6d28d9', opacity: 0.8 }}>
            Previous Images
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
            {[...image.images].reverse().map((imgItem) => {
              const isActive = imgItem.isDefault;
              return (
                <Box
                  key={imgItem._id}
                  onClick={() => !isActive && onSelectImage && onSelectImage(imgItem._id)}
                  sx={{
                    flexShrink: 0,
                    width: 72,
                    height: 54,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: isActive ? '2.5px solid #10b981' : '2px solid #e5e7eb',
                    cursor: isActive ? 'default' : 'pointer',
                    position: 'relative',
                    opacity: isActive ? 1 : 0.75,
                    transition: 'border-color 0.2s, opacity 0.2s',
                    '&:hover': !isActive ? { borderColor: '#a78bfa', opacity: 1 } : {},
                  }}
                >
                  <Box
                    component="img"
                    src={imgItem.url}
                    alt="Previous image"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        background: '#10b981',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* MAIN CONTENT */}
      <Box sx={{ px: 2, py: 2 }}>
        {/* DESCRIPTION SECTION */}
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={600} fontSize={15} sx={{ mb: 0.5, color: '#6d28d9' }}>
            Visual Description
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={scene.visual || ""}
            onChange={e => handleFieldChange("visual", e.target.value)}
            placeholder="Describe the scene visually..."
            sx={{
              background: '#fafaff',
              borderRadius: 2,
              mt: 0.5,
              '& .MuiInputBase-root': { fontSize: 15 },
            }}
          />
        </Box>

        {/* ENVIRONMENT & ACTIONS SECTION */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600} fontSize={15} sx={{ mb: 0.5, color: '#6d28d9' }}>
              Environment
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={Array.isArray(scene.environment) ? scene.environment.join(', ') : (scene.environment || '')}
              onChange={e => handleFieldChange("environment", e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Describe the environment..."
              sx={{ background: '#fafaff', borderRadius: 2, mt: 0.5, '& .MuiInputBase-root': { fontSize: 15 } }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600} fontSize={15} sx={{ mb: 0.5, color: '#6d28d9' }}>
              Key Actions
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={scene.actions || ""}
              onChange={e => handleFieldChange("actions", e.target.value)}
              placeholder="Describe key actions..."
              sx={{ background: '#fafaff', borderRadius: 2, mt: 0.5, '& .MuiInputBase-root': { fontSize: 15 } }}
            />
          </Box>
        </Box>

        {/* VOICEOVER SECTION */}
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={600} fontSize={15} sx={{ mb: 0.5, color: '#6d28d9' }}>
            Voiceover
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={scene.voiceover || ""}
            onChange={e => handleFieldChange("voiceover", e.target.value)}
            placeholder="Add voiceover script..."
            sx={{ background: '#fafaff', borderRadius: 2, mt: 0.5, '& .MuiInputBase-root': { fontSize: 15 } }}
          />
        </Box>

        {/* ACTION BUTTONS */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onSave}
            disabled={isSaving || isRegenerating || isGeneratingVideo}
            sx={{ fontWeight: 600, borderRadius: 2, borderColor: '#6d28d9', color: '#6d28d9', px: 2, '&:hover': { borderColor: '#4c1d95', background: '#f5f3ff' } }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onRegenerate}
            disabled={isRegenerating || isGeneratingVideo || isSaving}
            startIcon={<AutorenewIcon />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onGenerateVideo}
            disabled={!image?.image_path || isGeneratingVideo || isSaving}
            startIcon={<MovieIcon />}
            sx={{
              background: "linear-gradient(90deg,#a78bfa,#ec4899)",
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {isGeneratingVideo ? "Generating..." : "Generate Video"}
          </Button>
        </Box>

        {/* VIDEO PREVIEW */}
        {(videoState.videoUrl || video?.url) && (
          <Box mt={2}>
            <video
              controls
              style={{ width: "100%", borderRadius: 8 }}
              src={videoState.videoUrl || video?.url}
            />
          </Box>
        )}

        {/* VIDEO HISTORY STRIP */}
        {allVideos.length > 1 && (
          <Box mt={2}>
            <Typography fontSize={12} fontWeight={600} sx={{ mb: 1, color: '#6d28d9', opacity: 0.8 }}>
              Previous Videos
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
              {allVideos.map((vid) => {
                const isActive = vid.isLatest;
                const isReady = vid.status === 'completed' && vid.url;
                return (
                  <Box
                    key={vid._id}
                    onClick={() => isReady && !isActive && onSelectVideo && onSelectVideo(vid._id)}
                    sx={{
                      flexShrink: 0,
                      width: 72,
                      height: 54,
                      borderRadius: 1.5,
                      border: isActive ? '2.5px solid #10b981' : '2px solid #e5e7eb',
                      cursor: isReady && !isActive ? 'pointer' : 'default',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? '#ecfdf5' : '#f9fafb',
                      opacity: isReady ? 1 : 0.5,
                      transition: 'border-color 0.2s',
                      '&:hover': isReady && !isActive ? { borderColor: '#a78bfa' } : {},
                    }}
                  >
                    <Typography fontSize={13} fontWeight={700} sx={{ color: isActive ? '#10b981' : '#6b7280' }}>
                      V{vid.version}
                    </Typography>
                    <Typography fontSize={10} sx={{ color: '#9ca3af', mt: 0.25 }}>
                      {vid.status === 'completed' ? 'ready' : vid.status}
                    </Typography>
                    {isActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: '#10b981',
                          borderRadius: '50%',
                          width: 14,
                          height: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
