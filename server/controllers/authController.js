const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// Parse cookie header into an object (keeps us dependency-free).
const parseCookies = (header = '') => {
  const out = {};
  header.split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > -1) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start Google OAuth flow (redirects to Google)
// @route   GET /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return res.status(503).json({
        success: false,
        error: 'Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in the server .env.'
      });
    }

    // CSRF protection: bind a random state to the session cookie.
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account'
    });

    res.setHeader('Set-Cookie', `sp_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Google OAuth callback, find-or-create user, issue JWT
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const fail = (msg) => res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(msg)}`);

  try {
    const { code, state, error } = req.query;
    const cookies = parseCookies(req.headers.cookie);

    if (error) return fail(`Google authorization failed: ${error}`);
    if (!code) return fail('Missing authorization code.');
    if (!state || state !== cookies.sp_oauth_state) return fail('Invalid OAuth state. Please try again.');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) return fail('Google login is not configured.');

    // Exchange the authorization code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    if (!tokenRes.ok) return fail('Failed to exchange Google code for tokens.');
    const tokens = await tokenRes.json();

    // Fetch the user's profile with the access token.
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (!profileRes.ok) return fail('Failed to fetch Google profile.');
    const profile = await profileRes.json();
    if (!profile.email) return fail('Your Google account has no email address.');

    // Find or create the user (match by email or googleId to allow linking).
    let user = await User.findOne({ $or: [{ email: profile.email }, { googleId: profile.sub }] });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        provider: 'google',
        googleId: profile.sub
      });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      user.provider = 'google';
      await user.save();
    }

    const token = generateToken(user._id);
    res.clearCookie('sp_oauth_state');
    res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    fail(err.message || 'Google login failed. Please try again.');
  }
};

module.exports = { register, login, getMe, googleAuth, googleCallback };
