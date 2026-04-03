import { useState } from 'react';
import VisionProvider from '../context/VisionContext';
import { Container, Typography, Box, Button, Paper, Chip } from '@mui/material';

const useVision = VisionProvider.useVision;

export default function HomeScreen({ onNavigate }) {
  const { visionData } = useVision();
  const [error, setError] = useState(null);
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f3ff', color: '#1f2937' }}>

      {/* ================= HERO ================= */}
      <Box
        sx={{
          px: 2,
          pt: 6,
          pb: 10,
          background: `
            radial-gradient(circle at 20% 20%, rgba(168,139,250,0.35), transparent 40%),
            radial-gradient(circle at 80% 30%, rgba(244,114,182,0.25), transparent 40%),
            linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fdf4ff 100%)
          `,
          // boxShadow: "inset 0 -80px 120px rgba(0,0,0,0.6)",
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Good morning 👋
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mt: 1,
            lineHeight: 1.2,
          }}
        >
          Let’s step into your future ✨
        </Typography>
      </Box>

      {/* ================= CONTENT ================= */}
      <Container
        maxWidth="sm"
        sx={{
          mt: -8,
          pb: 14,
        }}
      >

        {/* ================= VISION REEL ================= */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            backdropFilter: "blur(30px)",
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}
        >
          {/* VIDEO */}
          <Box
            sx={{
              height: 180,
              borderRadius: 3,
              overflow: "hidden",
              position: "relative",
              background: visionData.finalVideo?.url ? '#000' : "url('/mock-vision.jpg')",
              backgroundImage: visionData.finalVideo?.url ? 'none' : "url('/mock-vision.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {visionData.finalVideo ? (
              <video
                src={visionData.finalVideo.url}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              />
            ) : (
              <>
                {/* Dark overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                  }}
                />
                {/* TEXT OVER IMAGE */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    color: "#fff",
                  }}
                >
                  <Typography fontWeight={600}>
                    Your Vision Reel
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Watch your future unfold (60 sec)
                  </Typography>
                </Box>
                {/* Play Button */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      color: '#000',
                    }}
                  >
                    ▶
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {/* CTA */}
          <Button
            fullWidth
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 600,
              background: "linear-gradient(90deg,#a78bfa,#c084fc,#f472b6)",
            }}
            variant="contained"
            onClick={() => {
              if (visionData.finalVideo) {
                // Scroll to video or replay logic if needed
                const videoEl = document.querySelector('video');
                if (videoEl) videoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                onNavigate && onNavigate(1);
              }
            }}
          >
            {visionData.finalVideo ? 'Watch Again' : 'Start Creating →'}
          </Button>
        </Paper>

        {/* ================= STREAK ================= */}
        <Paper
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            background: "rgba(255,255,255,0.9)", // 👈 more solid
            border: "1px solid rgba(0,0,0,0.05)", // 👈 subtle edge
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)", // 👈 depth
          }}
        >
          <Typography fontWeight={600}>
            🔥 5 Day Streak
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            You're building momentum
          </Typography>
        </Paper>

        {/* ================= FOCUS ================= */}
        <Paper
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            background: "rgba(255,255,255,0.9)", // 👈 more solid
            border: "1px solid rgba(0,0,0,0.05)", // 👈 subtle edge
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)", // 👈 depth
          }}
        >
          <Typography fontWeight={600}>
            ✨ Today’s Focus
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
            Visualize your biggest win this week
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label="💪 Powerful"
              sx={{
                bgcolor: "#ede9fe",
                color: "#6d28d9",
                fontWeight: 500,
              }}
            />
            <Chip
              label="🙂 Okay"
              sx={{
                bgcolor: "#f3f4f6",
                color: "#374151",
                fontWeight: 500,
              }}
            />
            <Chip
              label="🔌 Not connected"
              sx={{
                bgcolor: "#f3f4f6",
                color: "#6b7280",
                fontWeight: 500,
              }}
            />
          </Box>
        </Paper>

        {/* {loading && <LoadingSpinner />} */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      </Container>

    </Box>
  );
}
