import {
  Box,
  Typography,
  Paper,
  Stack,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import React from "react";
import api from "../api/axios";

export default function LoginPage({ onLogin }) {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google", {
        token: credentialResponse.credential,
      });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      onLogin(res.data);
    } catch (err) {
      setSnackbarMsg(
        "Google login failed. " +
          (err?.response?.data?.message || err.message)
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = () => {
    setSnackbarMsg("Google login failed. Please try again.");
    setSnackbarOpen(true);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 20% 20%, rgba(168, 139, 250, 0.25), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(244, 114, 182, 0.25), transparent 40%),
          linear-gradient(135deg, #f5f3ff, #fdf4ff)
        `,
        px: 2,
      }}
    >
      {/* TOP SECTION - BRANDING */}
      <Box sx={{ mb: 6, textAlign: "center", zIndex: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 2,
            background: "linear-gradient(90deg, #a78bfa, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          Livya ✨
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: "#1f2937",
            fontWeight: 600,
            mb: 1,
          }}
        >
          Craft Your Story. Frame by Frame.
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            maxWidth: 500,
            mx: "auto",
            fontSize: "0.95rem",
          }}
        >
          Transform your ideas into stunning cinematic videos with AI-powered
          scenes, voices, and visual magic.
        </Typography>
      </Box>

      {/* MAIN LOGIN CARD */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          width: "100%",
          maxWidth: 480,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(30px)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
          zIndex: 1,
        }}
      >
        <Stack spacing={4}>
          {/* GREETING */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                mb: 1,
              }}
            >
              Welcome Back 🎬
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
              }}
            >
              Sign in to continue creating your visual stories
            </Typography>
          </Box>

          {/* GOOGLE LOGIN BUTTON */}
          <Button
            fullWidth
            onClick={() => document.querySelector("div[role=button]")?.click()}
            sx={{
              py: 1.8,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              background: "linear-gradient(90deg, #a78bfa, #c084fc, #f472b6)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(167, 139, 250, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 30px rgba(167, 139, 250, 0.4)",
              },
              "&:active": {
                transform: "translateY(0px)",
              },
            }}
          >
            {loading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  component="span"
                  sx={{
                    animation: "spin 1s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  ⏳
                </Box>
                Signing in...
              </Stack>
            ) : (
              "Continue with Google"
            )}
          </Button>

          {/* DIVIDER */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1, height: 1, bg: "#e5e7eb" }} />
            <Typography sx={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              or
            </Typography>
            <Box sx={{ flex: 1, height: 1, bg: "#e5e7eb" }} />
          </Box>

          {/* INFO SECTION */}
          <Stack spacing={2}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(168, 139, 250, 0.05)",
                border: "1px solid rgba(168, 139, 250, 0.1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                ✨ What you can do:
              </Typography>
              <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="caption" sx={{ color: "#6b7280" }}>
                  Generate AI-powered scenes from text prompts
                </Typography>
                <Typography component="li" variant="caption" sx={{ color: "#6b7280" }}>
                  Create cinematic videos with voiceover
                </Typography>
                <Typography component="li" variant="caption" sx={{ color: "#6b7280" }}>
                  Extract and refine visual elements
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* FOOTER TEXT */}
          <Typography
            variant="caption"
            align="center"
            sx={{
              color: "#9ca3af",
              display: "block",
              mt: 2,
            }}
          >
            By continuing, you agree to our{" "}
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>
              Terms & Privacy Policy
            </span>
          </Typography>
        </Stack>
      </Paper>

      {/* HIDDEN GOOGLE LOGIN */}
      <Box sx={{ display: "none" }}>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          useOneTap
        />
      </Box>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}