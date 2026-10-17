const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { writeAudit } = require("../utils/audit");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/email");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VERIFICATION_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RESEND_MAX_ATTEMPTS = 3;
const RESEND_IP_MAX_ATTEMPTS = 10;
const RESET_MAX_ATTEMPTS = 3;
const RESET_IP_MAX_ATTEMPTS = 10;
const RATE_LIMIT_MAX_ENTRIES = 10000;

const rateLimitAttempts = new Map();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email) {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    email.length <= 254
  );
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
  };
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  return { token, tokenHash };
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createVerificationUrl(token) {
  const backendUrl = (
    process.env.BACKEND_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  return `${backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function createPasswordResetUrl(token) {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function createSession(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
}

function isRateLimited(key, maxAttempts) {
  const now = Date.now();
  const entry = rateLimitAttempts.get(key);

  if (!entry || now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) {
    if (rateLimitAttempts.size >= RATE_LIMIT_MAX_ENTRIES) {
      for (const [entryKey, value] of rateLimitAttempts) {
        if (now - value.startedAt >= RATE_LIMIT_WINDOW_MS) {
          rateLimitAttempts.delete(entryKey);
        }
      }

      if (rateLimitAttempts.size >= RATE_LIMIT_MAX_ENTRIES) {
        const oldestKey = rateLimitAttempts.keys().next().value;

        if (oldestKey !== undefined) {
          rateLimitAttempts.delete(oldestKey);
        }
      }
    }

    rateLimitAttempts.set(key, {
      startedAt: now,
      count: 1,
    });

    return false;
  }

  if (entry.count >= maxAttempts) {
    return true;
  }

  entry.count += 1;
  return false;
}

function isRateLimitedByEmailAndIp(email, ip, emailMax, ipMax, prefix) {
  const emailLimited = isRateLimited(
    `${prefix}:email:${email}`,
    emailMax
  );

  const ipLimited = isRateLimited(
    `${prefix}:ip:${ip}`,
    ipMax
  );

  return emailLimited || ipLimited;
}

// SIGNUP
router.post("/signup", async (req, res) => {
  let createdUser;
  let emailSent = false;

  try {
    const name = typeof req.body?.name === "string"
      ? req.body.name.trim()
      : "";

    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const requestedRole = req.body?.role;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        message: "Name must be between 2 and 80 characters",
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 12-128 characters and contain uppercase, lowercase, and numeric characters",
      });
    }

    const existingUser = await User.findOne({ email }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    const { token, tokenHash } = createVerificationToken();
    const hashedPassword = await bcrypt.hash(password, 12);

    const userRole = ["interviewer", "admin"].includes(requestedRole) ? requestedRole : "user";

    createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      emailVerified: false,
      accountStatus: "active",
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(
        Date.now() + VERIFICATION_TTL_MS
      ),
    });

    await sendVerificationEmail(
      email,
      name,
      createVerificationUrl(token)
    );

    emailSent = true;

    try {
      await writeAudit(
        {
          user: {
            userId: createdUser._id,
            email: createdUser.email,
            role: createdUser.role,
          },
        },
        "auth.signup_pending_verification",
        "user",
        createdUser._id,
        { email: createdUser.email }
      );
    } catch (auditError) {
      console.error("Signup audit failed:", auditError.message);
    }

    return res.status(201).json({
      message: "Account created. Check your email to verify your account.",
      requiresEmailVerification: true,
      user: publicUser(createdUser),
    });
  } catch (err) {
    if (createdUser?._id && !emailSent) {
      try {
        await User.deleteOne({ _id: createdUser._id });
      } catch (cleanupError) {
        console.error("Signup cleanup failed:", cleanupError.message);
      }
    }

    if (err?.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    console.error("Signup error:", err.message);

    return res.status(503).json({
      message: emailSent
        ? "Your account was created, but an internal operation failed. Try logging in."
        : "Registration could not be completed. Please try again later.",
    });
  }
});


router.post("/resend-verification", async (req, res) => {
  const genericResponse = {
    message:
      "If an unverified account exists for that email, a verification link will be sent.",
  };

  try {
    const email = normalizeEmail(req.body?.email);

    if (!email || !validEmail(email)) {
      return res.status(200).json(genericResponse);
    }

    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    if (
      isRateLimitedByEmailAndIp(
        email,
        ip,
        RESEND_MAX_ATTEMPTS,
        RESEND_IP_MAX_ATTEMPTS,
        "verify"
      )
    ) {
      return res.status(429).json({
        message: "Too many requests. Please try again in 15 minutes.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationTokenHash +emailVerificationExpiresAt"
    );

    if (
      !user ||
      user.emailVerified !== false ||
      user.accountStatus === "suspended"
    ) {
      return res.status(200).json(genericResponse);
    }

    const { token, tokenHash } = createVerificationToken();

    const previousTokenHash = user.emailVerificationTokenHash;
    const previousExpiry = user.emailVerificationExpiresAt;

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpiresAt = new Date(
      Date.now() + VERIFICATION_TTL_MS
    );

    await user.save();

    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        createVerificationUrl(token)
      );
    } catch (emailError) {
      user.emailVerificationTokenHash = previousTokenHash;
      user.emailVerificationExpiresAt = previousExpiry;
      await user.save();

      console.error(
        "Resend verification email failed:",
        emailError.message
      );

      return res.status(503).json({
        message:
          "Unable to send the verification email right now. Please try again later.",
      });
    }

    try {
      await writeAudit(
        {
          user: {
            userId: user._id,
            email: user.email,
            role: user.role,
          },
        },
        "auth.verification_resent",
        "user",
        user._id,
        {}
      );
    } catch (auditError) {
      console.error(
        "Verification resend audit failed:",
        auditError.message
      );
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("Resend verification failed:", err.message);

    return res.status(500).json({
      message: "Unable to process the request right now.",
    });
  }
});


router.get("/verify-email", async (req, res) => {
  try {
    const token = typeof req.query.token === "string"
      ? req.query.token
      : "";

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Verification link is invalid or expired",
      });
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (!user) {
      return res.status(400).json({
        message: "Verification link is invalid or expired",
      });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;

    await user.save();

    try {
      await writeAudit(
        {
          user: {
            userId: user._id,
            email: user.email,
            role: user.role,
          },
        },
        "auth.email_verified",
        "user",
        user._id,
        {}
      );
    } catch (auditError) {
      console.error("Email verification audit failed:", auditError.message);
    }

    return res.json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Email verification error:", err.message);

    return res.status(500).json({
      message: "Could not verify email. Please try again.",
    });
  }
});


router.post("/forgot-password", async (req, res) => {
  const genericResponse = {
    message:
      "If an eligible account exists for that email, password-reset instructions will be sent.",
  };

  try {
    const email = normalizeEmail(req.body?.email);

    if (!email || !validEmail(email)) {
      return res.status(200).json(genericResponse);
    }

    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    if (
      isRateLimitedByEmailAndIp(
        email,
        ip,
        RESET_MAX_ATTEMPTS,
        RESET_IP_MAX_ATTEMPTS,
        "password-reset"
      )
    ) {
      return res.status(429).json({
        message: "Too many requests. Please try again in 15 minutes.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt"
    );

    if (
      !user ||
      user.accountStatus === "suspended" ||
      user.emailVerified === false
    ) {
      return res.status(200).json(genericResponse);
    }

    const { token, tokenHash } = createVerificationToken();

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_MS
    );

    await user.save();

    try {
      await sendPasswordResetEmail(
        user.email,
        user.name,
        createPasswordResetUrl(token)
      );
    } catch (emailError) {

      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      console.error("Password-reset email failed:", emailError.message);


      return res.status(200).json(genericResponse);
    }

    try {
      await writeAudit(
        {
          user: {
            userId: user._id,
            email: user.email,
            role: user.role,
          },
        },
        "auth.password_reset_requested",
        "user",
        user._id,
        {}
      );
    } catch (auditError) {
      console.error(
        "Password-reset request audit failed:",
        auditError.message
      );
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("Forgot-password request failed:", err.message);

    return res.status(200).json(genericResponse);
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const token = typeof req.body?.token === "string"
      ? req.body.token
      : "";

    const password = req.body?.password;

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Password-reset link is invalid or expired.",
      });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 12-128 characters and contain uppercase, lowercase, and numeric characters.",
      });
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      emailVerified: true,
      accountStatus: "active",
    }).select("+passwordResetTokenHash +passwordResetExpiresAt +password");

    if (!user) {
      return res.status(400).json({
        message: "Password-reset link is invalid or expired.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save();

    try {
      await writeAudit(
        {
          user: {
            userId: user._id,
            email: user.email,
            role: user.role,
          },
        },
        "auth.password_reset_completed",
        "user",
        user._id,
        {}
      );
    } catch (auditError) {
      console.error(
        "Password-reset completion audit failed:",
        auditError.message
      );
    }

    return res.json({
      message:
        "Password reset successfully. Please log in again with your new password.",
    });
  } catch (err) {
    console.error("Password reset failed:", err.message);

    return res.status(500).json({
      message: "Unable to reset password right now. Please try again.",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message: "This account is suspended",
      });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresEmailVerification: true,
      });
    }

    const token = createSession(user);

    await writeAudit(
      {
        user: {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
      },
      "auth.login",
      "user",
      user._id,
      { email: user.email }
    );

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
});



// Google sign-in from the existing main branch
router.post("/google", async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const credential = String(req.body?.credential || "");

    if (!clientId) {
      return res.status(503).json({
        message: "Google sign-in is not configured",
      });
    }

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const ticket = await new (require("google-auth-library").OAuth2Client)(
      clientId
    ).verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const profile = ticket.getPayload();

    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({
        message: "Google account could not be verified",
      });
    }

    const email = normalizeEmail(profile.email);

    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email }],
    });

    if (user?.googleId && user.googleId !== profile.sub) {
      return res.status(409).json({
        message: "This email is linked to a different Google account",
      });
    }

    if (user?.accountStatus === "suspended") {
      return res.status(403).json({
        message: "This account is suspended",
      });
    }

    if (!user) {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );

      user = await User.create({
        name: String(profile.name || email.split("@")[0]).trim(),
        email,
        password: randomPassword,
        googleId: profile.sub,
        avatarUrl: profile.picture || "",
        role: "user",
        emailVerified: true,
      });
    } else {
      user.googleId = profile.sub;
      user.emailVerified = true;

      if (!user.avatarUrl && profile.picture) {
        user.avatarUrl = profile.picture;
      }

      await user.save();
    }

    const token = createSession(user);

    await writeAudit(
      {
        user: {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
      },
      "auth.google_login",
      "user",
      user._id,
      { email: user.email }
    );

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Google login error:", err.message);

    return res.status(401).json({
      message: "Google sign-in could not be verified",
    });
  }
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("Me error:", err.message);

    return res.status(500).json({
      message: "Server error fetching profile",
    });
  }
});

// UPDATE PROFILE
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (name.length < 2 || name.length > 80) {
        return res.status(400).json({
          message: "Name must be between 2 and 80 characters",
        });
      }

      user.name = name;
    }

    if (req.body.email !== undefined) {
      const email = normalizeEmail(req.body.email);

      if (!validEmail(email)) {
        return res.status(400).json({
          message: "Enter a valid email address",
        });
      }

      if (email !== user.email) {
        return res.status(400).json({
          message:
            "Email changes require a separate email verification flow",
        });
      }
    }

    if (req.body.phone !== undefined) {
      user.phone = String(req.body.phone || "").trim();
    }

    if (req.body.bio !== undefined) {
      user.bio = String(req.body.bio || "").trim();
    }

    if (req.body.avatarUrl !== undefined) {
      user.avatarUrl = String(req.body.avatarUrl || "").trim();
    }

    if (req.body.password !== undefined) {
      return res.status(400).json({
        message: "Password changes require a separate reauthentication flow",
      });
    }

    await user.save();

    try {
      await writeAudit(
        req,
        "profile.updated",
        "user",
        user._id,
        {
          fields: Object.keys(req.body || {}).filter(
            (key) => !["password", "email"].includes(key)
          ),
        }
      );
    } catch (auditError) {
      console.error("Profile audit failed:", auditError.message);
    }

    return res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("Profile update error:", err.message);

    return res.status(500).json({
      message: "Server error updating profile",
    });
  }
});

module.exports = router;
