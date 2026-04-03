import { verifyGoogleToken } from "../utils/googleAuth.js";
import { generateToken } from "../utils/jwt.js";
import User from "../models/User.js";

// replace with your actual DB model
const users = [];

export const googleLogin = async (req, res) => {
  try {
    const { token: idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "No token provided" });
    }

    const googleUser = await verifyGoogleToken(idToken);

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create(googleUser);
    }

    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid Google token" });
  }
};