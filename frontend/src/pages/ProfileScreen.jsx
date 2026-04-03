import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  TextField,
  MenuItem,
  IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useState, useRef, useEffect } from "react";
import VisionProvider from "../context/VisionContext";

export default function ProfileScreen({ onLogout }) {
  const { visionData, updateVisionData } = VisionProvider.useVision();
  const [name, setName] = useState("Monsoon");
  const [editingName, setEditingName] = useState(false);
  const [gender, setGender] = useState(visionData.protagonistGender || "");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicBase64, setProfilePicBase64] = useState(visionData.protagonistBase64 || "");
  const fileInputRef = useRef();

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicBase64(reader.result.split(",")[1] || "");
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync gender and profilePicBase64 to VisionContext
  useEffect(() => {
    updateVisionData({ protagonistGender: gender, protagonistBase64: profilePicBase64 });
  }, [gender, profilePicBase64, updateVisionData]);

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
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              src={profilePic || (profilePicBase64 ? `data:image/*;base64,${profilePicBase64}` : undefined)}
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 1.5,
                background:
                  "linear-gradient(135deg,#a78bfa,#ec4899)",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {!profilePic && !profilePicBase64 && name.charAt(0)}
            </Avatar>
            <IconButton
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                bgcolor: "#fff",
                boxShadow: 1,
                p: 0.5,
                zIndex: 2
              }}
              component="span"
              onClick={() => fileInputRef.current.click()}
            >
              <PhotoCamera fontSize="small" color="primary" />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
            />
          </Box>

          {editingName ? (
            <TextField
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              size="small"
              autoFocus
              sx={{
                mt: 1,
                mb: 0.5,
                fontWeight: 700,
                input: { textAlign: "center", fontWeight: 700, fontSize: 22 }
              }}
              variant="standard"
            />
          ) : (
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ cursor: "pointer" }}
              onClick={() => setEditingName(true)}
            >
              {name}
            </Typography>
          )}

          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              select
              label="Gender"
              value={gender}
              onChange={e => setGender(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Building my future one vision at a time ✨
          </Typography>
        </Box>

        {/* ================= STATS ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            mb: 2.5,
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight={600} mb={1.5}>
            Your Progress
          </Typography>

          <Box display="flex" justifyContent="space-between">
            <Box textAlign="center">
              <Typography fontWeight={700}>12</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Visions
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography fontWeight={700}>5🔥</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Streak
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography fontWeight={700}>8</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Videos
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* ================= ACHIEVEMENTS ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            mb: 2.5,
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight={600} mb={1.5}>
            Achievements
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              icon={<EmojiEventsIcon />}
              label="First Vision"
              sx={{
                bgcolor: "#ede9fe",
                color: "#6d28d9",
              }}
            />
            <Chip
              icon={<EmojiEventsIcon />}
              label="5 Day Streak"
              sx={{
                bgcolor: "#fce7f3",
                color: "#be185d",
              }}
            />
          </Box>
        </Paper>

        {/* ================= SETTINGS ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight={600} mb={1.5}>
            Settings
          </Typography>

          <Button fullWidth sx={{ justifyContent: "space-between" }}>
            Account Settings
          </Button>

          <Divider sx={{ my: 1 }} />

          <Button fullWidth sx={{ justifyContent: "space-between" }}>
            Privacy
          </Button>

          <Divider sx={{ my: 1 }} />

          <Button fullWidth sx={{ justifyContent: "space-between" }}>
            Notifications
          </Button>

          <Divider sx={{ my: 1 }} />

          <Button
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{ justifyContent: "flex-start", color: "#ef4444" }}
            onClick={onLogout}
          >
            Logout
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}