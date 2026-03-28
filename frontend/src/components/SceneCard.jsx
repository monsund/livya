import { useState as useLocalState } from "react";

import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import MovieIcon from "@mui/icons-material/Movie";

// Available environment options
const ENVIRONMENT_OPTIONS = [
  "Office setting",
  "Home environment",
  "Nature scenes",
  "Cozy indoor space",
];

export default function SceneCard({
  scene,
  image,
  index,
  video,
  videoState = {},
  onRegenerate,
  onGenerateVideo,
  onSceneChange,
  isRegenerating = false,
  isGeneratingVideo = false,
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
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={Array.isArray(scene.environment) ? scene.environment : []}
                onChange={e => handleFieldChange("environment", e.target.value)}
                sx={{ background: '#fafaff', borderRadius: 2 }}
              >
                {ENVIRONMENT_OPTIONS.map(env => (
                  <MenuItem key={env} value={env}>
                    {env}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

        {/* ADVANCED SECTION (PROGRESSIVE DISCLOSURE) */}
        <Box sx={{ mb: 2 }}>
          <AccordionSection label="Voiceover (optional)">
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={scene.voiceover || ""}
              onChange={e => handleFieldChange("voiceover", e.target.value)}
              placeholder="Add voiceover script..."
              sx={{ background: '#fafaff', borderRadius: 2, mt: 0.5, '& .MuiInputBase-root': { fontSize: 15 } }}
            />
          </AccordionSection>
        </Box>

        {/* ACTION BUTTONS */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onRegenerate}
            disabled={isRegenerating || isGeneratingVideo}
            startIcon={<AutorenewIcon />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onGenerateVideo}
            disabled={!image?.image_path || isGeneratingVideo}
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
        {(videoState.videoUrl || video?.videoUrl) && (
          <Box mt={2}>
            <video
              controls
              style={{ width: "100%", borderRadius: 8 }}
              src={videoState.videoUrl || video?.videoUrl}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
// Minimal AccordionSection for progressive disclosure
function AccordionSection({ label, children }) {
  const [open, setOpen] = useLocalState(false);
  return (
    <Box sx={{ mb: 1 }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#6366f1',
          fontWeight: 600,
          fontSize: 15,
          mb: open ? 1 : 0,
          userSelect: 'none',
        }}
      >
        {label}
        <Box component="span" sx={{ ml: 1, fontSize: 18, opacity: 0.7 }}>{open ? '▲' : '▼'}</Box>
      </Box>
      {open && <Box>{children}</Box>}
    </Box>
  );
}
}