const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
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

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// @desc    Register user (requires email verification before first login)
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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      password,
      emailVerified: false,
      verificationToken,
      verificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24h
    });

    const link = `${clientUrl()}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your StudyPilot account',
        text: `Hi ${user.name},\n\nWelcome to StudyPilot! Please verify your email to activate your account:\n\n${link}\n\nThis link expires in 24 hours.\nIf you didn't create this account, you can ignore this email.`,
        html: `<p>Hi ${user.name},</p><p>Welcome to StudyPilot! Please verify your email to activate your account:</p><p><a href="${link}">Verify my account</a></p><p>(or open: ${link})</p><p>This link expires in 24 hours.</p>`
      });
    } catch (mailErr) {
      // Email failures must not block registration — the flow stays usable
      // and a resend option exists. Log for visibility on the server side.
      console.error(`[mail] verification email failed to send to ${user.email}:`, mailErr.message);
    }

    res.status(201).json({
      success: true,
      needsVerification: true,
      message: 'Account created! Check your inbox (and spam) for a verification link, then log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address via emailed token
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'This verification link is invalid or has expired. Please register again to receive a new link.'
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend the verification email for an unverified account
// @route   POST /api/auth/resend-verification
// @access  Public (only succeeds for unverified accounts)
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Do not reveal whether the account exists.
    if (!user || user.emailVerified) {
      return res.json({ success: true, message: 'If that account needs verification, a new link has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const link = `${clientUrl()}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your StudyPilot account',
      text: `Hi ${user.name},\n\nHere's a fresh verification link for your StudyPilot account:\n\n${link}\n\nThis link expires in 24 hours.`,
      html: `<p>Hi ${user.name},</p><p>Here's a fresh verification link for your StudyPilot account:</p><p><a href="${link}">Verify my account</a></p><p>(or open: ${link})</p><p>This link expires in 24 hours.</p>`
    });

    res.json({ success: true, message: 'If that account needs verification, a new link has been sent.' });
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

    // Block only accounts explicitly created unverified (legacy accounts,
    // where the field is undefined, and Google accounts pass through).
    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        needsVerification: true,
        error: 'Please verify your email before logging in. Check your inbox (and spam) for the verification link we sent.'
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

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way so we don't leak which emails are registered.
    if (!user) {
      return res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    const link = `${clientUrl()}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your StudyPilot password',
      text: `Hi ${user.name},\n\nWe received a request to reset your StudyPilot password. Click the link below to set a new one:\n\n${link}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>We received a request to reset your StudyPilot password. Click the link below to set a new one:</p><p><a href="${link}">Reset my password</a></p><p>(or open: ${link})</p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`
    });

    res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Set a new password using a reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'A reset token is required.' });
    }
    if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and contain a letter and a number.'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'This reset link is invalid or has expired. Please request a new one.'
      });
    }

    user.password = password; // pre-save hook hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated! You can now log in with your new password.' });
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
  const fail = (msg) => res.redirect(`${clientUrl()}/auth/callback?error=${encodeURIComponent(msg)}`);

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
      // Google has already verified this email, so mark it verified.
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        provider: 'google',
        googleId: profile.sub,
        emailVerified: true
      });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      user.provider = 'google';
      if (user.emailVerified === false) user.emailVerified = true; // Google verified it
      await user.save();
    }

    const token = generateToken(user._id);
    res.clearCookie('sp_oauth_state');
    res.redirect(`${clientUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    fail(err.message || 'Google login failed. Please try again.');
  }
};

module.exports = { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword, getMe, googleAuth, googleCallback };