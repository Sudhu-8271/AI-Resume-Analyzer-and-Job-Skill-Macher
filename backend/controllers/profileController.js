const bcrypt = require("bcrypt");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");

const User = require("../models/User");
const Resume = require("../models/Resume");

/* =========================================================
   GROQ SETUP
========================================================= */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "openai/gpt-oss-20b";

/* =========================================================
   EDITABLE PROFILE FIELDS
========================================================= */

const editableProfileFields = [
  "headline",
  "location",
  "currentRole",
  "careerLevel",
  "yearsOfExperience",
  "preferredRole",
  "preferredIndustry",
  "technicalSkills",
  "softSkills",
  "programmingLanguages",
  "tools",
  "education",
  "experience",
  "careerPreferences",
];

/* =========================================================
   SAFE USER RESPONSE
========================================================= */

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  email: user.email,
  phone: user.phone,
  provider: user.provider,
  isVerified: user.isVerified,
  emailVerified: user.emailVerified || user.isVerified,
  phoneVerified: user.phoneVerified,
  profile: user.profile || {},
  settings: user.settings || {},
});

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function normalizeSkillArray(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill.trim(),
          proficiency: "Intermediate",
        };
      }

      return {
        name: cleanString(skill?.name),
        proficiency: [
          "Beginner",
          "Intermediate",
          "Advanced",
          "Expert",
        ].includes(skill?.proficiency)
          ? skill.proficiency
          : "Intermediate",
      };
    })
    .filter((skill) => skill.name);
}

function normalizeEducation(education) {
  if (!Array.isArray(education)) {
    return [];
  }

  return education
    .map((item) => ({
      degree: cleanString(item?.degree),
      fieldOfStudy: cleanString(item?.fieldOfStudy),
      institution: cleanString(item?.institution),
      startYear:
        item?.startYear !== undefined &&
        item?.startYear !== null &&
        item?.startYear !== ""
          ? cleanNumber(item.startYear, undefined)
          : undefined,
      graduationYear:
        item?.graduationYear !== undefined &&
        item?.graduationYear !== null &&
        item?.graduationYear !== ""
          ? cleanNumber(item.graduationYear, undefined)
          : undefined,
      score: cleanString(item?.score),
    }))
    .filter(
      (item) =>
        item.degree ||
        item.fieldOfStudy ||
        item.institution
    );
}

function normalizeExperience(experience) {
  if (!Array.isArray(experience)) {
    return [];
  }

  return experience
    .map((item) => ({
      company: cleanString(item?.company),
      jobTitle: cleanString(item?.jobTitle),
      employmentType: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Freelance",
        "",
      ].includes(item?.employmentType)
        ? item.employmentType
        : "",

      startDate: item?.startDate
        ? new Date(item.startDate)
        : undefined,

      endDate: item?.endDate
        ? new Date(item.endDate)
        : undefined,

      currentlyWorking: Boolean(
        item?.currentlyWorking
      ),

      responsibilities: cleanString(
        item?.responsibilities
      ),

      achievements: cleanString(
        item?.achievements
      ),
    }))
    .filter(
      (item) =>
        item.company ||
        item.jobTitle ||
        item.responsibilities ||
        item.achievements
    );
}

/* =========================================================
   EXTRACT JSON FROM GROQ RESPONSE
========================================================= */

function extractJSON(text) {
  if (!text) {
    return null;
  }

  let cleaned = String(text).trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Direct JSON
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // continue
  }

  // Find first JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    const possibleJSON = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );

    try {
      return JSON.parse(possibleJSON);
    } catch (error) {
      return null;
    }
  }

  return null;
}

/* =========================================================
   AI RESUME PROFILE EXTRACTION
========================================================= */

async function extractProfileFromResume(
  resumeText
) {
  if (!process.env.GROQ_API_KEY) {
    console.warn(
      "GROQ_API_KEY is missing. Resume profile extraction skipped."
    );

    return null;
  }

  if (!resumeText || !resumeText.trim()) {
    return null;
  }

  const prompt = `
You are a professional resume parser.

Read the resume below and extract ONLY information that is explicitly present in the resume.

IMPORTANT RULES:

1. NEVER invent information.
2. NEVER guess missing information.
3. If something is not available, use an empty string, empty array, or 0.
4. Extract real skills only from the resume.
5. Do not create fake companies, jobs, degrees, dates or achievements.
6. Return ONLY valid JSON.
7. Do not use markdown.
8. Do not add explanations outside JSON.
9. Preserve the actual meaning of the resume.
10. Experience years should be based on clearly stated experience.
11. If the resume has multiple jobs, include all identifiable jobs.
12. If the resume has multiple degrees, include all identifiable degrees.
13. Skill proficiency should be conservative. Use "Intermediate" unless the resume clearly indicates stronger or weaker proficiency.

Return exactly this JSON structure:

{
  "name": "",
  "headline": "",
  "location": "",
  "currentRole": "",
  "careerLevel": "",
  "yearsOfExperience": 0,
  "preferredRole": "",
  "preferredIndustry": "",

  "technicalSkills": [
    {
      "name": "",
      "proficiency": "Beginner"
    }
  ],

  "softSkills": [
    {
      "name": "",
      "proficiency": "Intermediate"
    }
  ],

  "programmingLanguages": [
    {
      "name": "",
      "proficiency": "Intermediate"
    }
  ],

  "tools": [
    {
      "name": "",
      "proficiency": "Intermediate"
    }
  ],

  "education": [
    {
      "degree": "",
      "fieldOfStudy": "",
      "institution": "",
      "startYear": 0,
      "graduationYear": 0,
      "score": ""
    }
  ],

  "experience": [
    {
      "company": "",
      "jobTitle": "",
      "employmentType": "",
      "startDate": "",
      "endDate": "",
      "currentlyWorking": false,
      "responsibilities": "",
      "achievements": ""
    }
  ]
}

Allowed careerLevel values:

"Fresher"
"Entry Level"
"Mid Level"
"Senior Level"
""

Allowed employmentType values:

"Full-time"
"Part-time"
"Contract"
"Internship"
"Freelance"
""

Allowed proficiency values:

"Beginner"
"Intermediate"
"Advanced"
"Expert"

RESUME:

${resumeText}
`;

  try {
    const response =
      await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a strict resume extraction engine. Return valid JSON only. Never invent data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 4000,
        response_format: {
          type: "json_object",
        },
      });

    const content =
      response?.choices?.[0]?.message?.content;

    const parsed = extractJSON(content);

    if (!parsed) {
      console.error(
        "Groq returned invalid resume JSON."
      );

      return null;
    }

    return parsed;
  } catch (error) {
    console.error(
      "Resume AI extraction error:",
      error.message
    );

    return null;
  }
}

/* =========================================================
   NORMALIZE AI PROFILE
========================================================= */

function normalizeAIProfile(aiProfile) {
  if (!aiProfile) {
    return null;
  }

  let careerLevel = cleanString(
    aiProfile.careerLevel
  );

  if (
    ![
      "Fresher",
      "Entry Level",
      "Mid Level",
      "Senior Level",
      "",
    ].includes(careerLevel)
  ) {
    careerLevel = "";
  }

  let yearsOfExperience = cleanNumber(
    aiProfile.yearsOfExperience,
    0
  );

  yearsOfExperience = Math.max(
    0,
    Math.min(80, yearsOfExperience)
  );

  const profile = {
    headline: cleanString(
      aiProfile.headline
    ),

    location: cleanString(
      aiProfile.location
    ),

    currentRole: cleanString(
      aiProfile.currentRole
    ),

    careerLevel,

    yearsOfExperience,

    preferredRole: cleanString(
      aiProfile.preferredRole
    ),

    preferredIndustry: cleanString(
      aiProfile.preferredIndustry
    ),

    technicalSkills:
      normalizeSkillArray(
        aiProfile.technicalSkills
      ),

    softSkills:
      normalizeSkillArray(
        aiProfile.softSkills
      ),

    programmingLanguages:
      normalizeSkillArray(
        aiProfile.programmingLanguages
      ),

    tools:
      normalizeSkillArray(
        aiProfile.tools
      ),

    education:
      normalizeEducation(
        aiProfile.education
      ),

    experience:
      normalizeExperience(
        aiProfile.experience
      ),
  };

  return profile;
}

/* =========================================================
   GET PROFILE
========================================================= */

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select(
      "-passwordHash -refreshTokens -otp -lastOtpSentAt"
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const resume = await Resume.findOne({
      userId: user._id,
    })
      .sort({ updatedAt: -1 })
      .select("-fileData");

    return res.json({
      success: true,
      user: safeUser(user),
      resume,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      error: "Unable to load profile.",
    });
  }
};

/* =========================================================
   UPDATE PROFILE MANUALLY
========================================================= */

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};

    for (
      const field of editableProfileFields
    ) {
      if (
        req.body[field] !== undefined
      ) {
        updates[`profile.${field}`] =
          req.body[field];
      }
    }

    /* NAME */

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length < 2 ||
        req.body.name.length > 120
      ) {
        return res.status(400).json({
          error:
            "Name must be between 2 and 120 characters.",
        });
      }

      updates.name =
        req.body.name.trim();
    }

    /* PHONE */

    if (req.body.phone !== undefined) {
      const phone =
        String(req.body.phone).trim();

      if (
        !/^\+?[0-9\s()-]{7,20}$/.test(
          phone
        )
      ) {
        return res.status(400).json({
          error:
            "Please enter a valid phone number.",
        });
      }

      updates.phone =
        phone.replace(/[^\d+]/g, "");
    }

    /* USERNAME */

    if (
      req.body.username !== undefined
    ) {
      const username =
        String(
          req.body.username
        ).trim();

      if (
        !/^[a-zA-Z0-9_.-]{3,30}$/.test(
          username
        )
      ) {
        return res.status(400).json({
          error:
            "Username must be 3-30 characters.",
        });
      }

      const conflict =
        await User.findOne({
          username,
          _id: {
            $ne: req.user.userId,
          },
        });

      if (conflict) {
        return res.status(409).json({
          error:
            "Username is already taken.",
        });
      }

      updates.username =
        username;
    }

    /* EXPERIENCE VALIDATION */

    if (
      updates[
        "profile.yearsOfExperience"
      ] !== undefined
    ) {
      const years = Number(
        updates[
          "profile.yearsOfExperience"
        ]
      );

      if (
        years < 0 ||
        years > 80
      ) {
        return res.status(400).json({
          error:
            "Experience must be between 0 and 80 years.",
        });
      }

      updates[
        "profile.yearsOfExperience"
      ] = years;
    }

    const user =
      await User.findByIdAndUpdate(
        req.user.userId,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-passwordHash -refreshTokens -otp -lastOtpSentAt"
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: safeUser(user),
      message: "Profile saved.",
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        error:
          "That username is already taken.",
      });
    }

    return res.status(400).json({
      error:
        error.message ||
        "Unable to save profile.",
    });
  }
};

/* =========================================================
   UPLOAD RESUME + AUTO EXTRACT PROFILE
========================================================= */

exports.uploadResume = async (
  req,
  res
) => {
  try {
    /* CHECK FILE */

    if (!req.file) {
      return res.status(400).json({
        error:
          "Please choose a PDF resume.",
      });
    }

    /* CHECK PDF */

    if (
      req.file.mimetype !==
      "application/pdf"
    ) {
      return res.status(400).json({
        error:
          "Only PDF resumes are supported.",
      });
    }

    /* CHECK SIZE */

    if (
      req.file.size >
      8 * 1024 * 1024
    ) {
      return res.status(400).json({
        error:
          "Resume file must be smaller than 8MB.",
      });
    }

    /* =====================================================
       EXTRACT PDF TEXT
    ===================================================== */

    let resumeText = "";

    try {
      const pdfData =
        await pdfParse(
          req.file.buffer
        );

      resumeText =
        pdfData?.text?.trim() || "";
    } catch (pdfError) {
      console.error(
        "PDF parsing error:",
        pdfError
      );

      return res.status(400).json({
        error:
          "Unable to read this PDF resume.",
      });
    }

    if (!resumeText) {
      return res.status(400).json({
        error:
          "No readable text was found in the PDF. Please upload a text-based PDF.",
      });
    }

    /* =====================================================
       AI PROFILE EXTRACTION
    ===================================================== */

    let extractedProfile =
      null;

    try {
      const aiProfile =
        await extractProfileFromResume(
          resumeText
        );

      extractedProfile =
        normalizeAIProfile(
          aiProfile
        );
    } catch (aiError) {
      console.error(
        "Profile extraction failed:",
        aiError
      );

      extractedProfile = null;
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    const user =
      await User.findById(
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    /* =====================================================
       UPDATE USER PROFILE FROM RESUME
    ===================================================== */

    if (extractedProfile) {
      const profileUpdate = {};

      /*
       * Only replace profile values when
       * AI actually found useful information.
       */

      if (
        extractedProfile.headline
      ) {
        profileUpdate.headline =
          extractedProfile.headline;
      }

      if (
        extractedProfile.location
      ) {
        profileUpdate.location =
          extractedProfile.location;
      }

      if (
        extractedProfile.currentRole
      ) {
        profileUpdate.currentRole =
          extractedProfile.currentRole;
      }

      if (
        extractedProfile.careerLevel
      ) {
        profileUpdate.careerLevel =
          extractedProfile.careerLevel;
      }

      if (
        extractedProfile.yearsOfExperience !==
        undefined
      ) {
        profileUpdate.yearsOfExperience =
          extractedProfile.yearsOfExperience;
      }

      if (
        extractedProfile.preferredRole
      ) {
        profileUpdate.preferredRole =
          extractedProfile.preferredRole;
      }

      if (
        extractedProfile.preferredIndustry
      ) {
        profileUpdate.preferredIndustry =
          extractedProfile.preferredIndustry;
      }

      if (
        extractedProfile
          .technicalSkills?.length
      ) {
        profileUpdate.technicalSkills =
          extractedProfile.technicalSkills;
      }

      if (
        extractedProfile
          .softSkills?.length
      ) {
        profileUpdate.softSkills =
          extractedProfile.softSkills;
      }

      if (
        extractedProfile
          .programmingLanguages?.length
      ) {
        profileUpdate.programmingLanguages =
          extractedProfile.programmingLanguages;
      }

      if (
        extractedProfile.tools?.length
      ) {
        profileUpdate.tools =
          extractedProfile.tools;
      }

      if (
        extractedProfile.education?.length
      ) {
        profileUpdate.education =
          extractedProfile.education;
      }

      if (
        extractedProfile.experience?.length
      ) {
        profileUpdate.experience =
          extractedProfile.experience;
      }

      if (
        Object.keys(profileUpdate)
          .length > 0
      ) {
        for (
          const [key, value] of Object.entries(
            profileUpdate
          )
        ) {
          user.profile[key] =
            value;
        }

        /* NAME FROM RESUME */

        if (
          extractedProfile.name &&
          (!user.name ||
            user.name.trim().length === 0)
        ) {
          user.name =
            extractedProfile.name;
        }

        await user.save();
      }
    }

    /* =====================================================
       SAVE RESUME
    ===================================================== */

    const resume =
      await Resume.findOneAndUpdate(
        {
          userId:
            req.user.userId,
        },
        {
          $set: {
            userId:
              req.user.userId,

            fileName:
              req.file.originalname,

            mimeType:
              req.file.mimetype,

            fileData:
              req.file.buffer,

            resumeText,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    /* =====================================================
       GET UPDATED USER
    ===================================================== */

    const updatedUser =
      await User.findById(
        req.user.userId
      ).select(
        "-passwordHash -refreshTokens -otp -lastOtpSentAt"
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      success: true,

      message:
        extractedProfile
          ? "Resume uploaded and profile information extracted successfully."
          : "Resume uploaded successfully, but profile information could not be extracted.",

      resume:
        resume.toObject({
          transform: (
            doc,
            ret
          ) => {
            delete ret.fileData;
            return ret;
          },
        }),

      user: safeUser(
        updatedUser
      ),

      extracted:
        Boolean(
          extractedProfile
        ),

      extractedProfile:
        extractedProfile || {},
    });
  } catch (error) {
    console.error(
      "Upload resume error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Unable to upload resume.",
    });
  }
};

/* =========================================================
   DOWNLOAD RESUME
========================================================= */

exports.downloadResume = async (
  req,
  res
) => {
  try {
    const resume =
      await Resume.findOne({
        userId:
          req.user.userId,
      }).sort({
        updatedAt: -1,
      });

    if (
      !resume ||
      !resume.fileData
    ) {
      return res.status(404).json({
        error:
          "No uploaded resume found.",
      });
    }

    const fileName =
      resume.fileName ||
      "resume.pdf";

    const safeFileName =
      fileName.replace(
        /["\r\n]/g,
        ""
      );

    return res
      .type(
        resume.mimeType ||
          "application/pdf"
      )
      .set(
        "Content-Disposition",
        `attachment; filename="${safeFileName}"`
      )
      .send(
        resume.fileData
      );
  } catch (error) {
    console.error(
      "Download resume error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to download resume.",
    });
  }
};

/* =========================================================
   REMOVE RESUME
========================================================= */

exports.removeResume = async (
  req,
  res
) => {
  try {
    await Resume.deleteMany({
      userId:
        req.user.userId,
    });

    /*
     * Resume remove karne par automatically
     * manually entered profile delete nahi karenge.
     */

    return res.json({
      success: true,
      message:
        "Resume data removed.",
    });
  } catch (error) {
    console.error(
      "Remove resume error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to remove resume.",
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

exports.changePassword = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      newPassword !==
        confirmPassword ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        error:
          "Provide the current password and a matching new password of at least 8 characters.",
      });
    }

    const user =
      await User.findById(
        req.user.userId
      );

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(
        currentPassword,
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        error:
          "Current password is incorrect.",
      });
    }

    user.passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.refreshTokens = [];

    await user.save();

    return res.json({
      success: true,
      message:
        "Password changed. Please sign in again on other devices.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to change password.",
    });
  }
};

/* =========================================================
   LOGOUT ALL
========================================================= */

exports.logoutAll = async (
  req,
  res
) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          refreshTokens: [],
        },
      }
    );

    return res.json({
      success: true,
      message:
        "All sessions have been signed out.",
    });
  } catch (error) {
    console.error(
      "Logout all error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to sign out all sessions.",
    });
  }
};

/* =========================================================
   DELETE ACCOUNT
========================================================= */

exports.deleteAccount = async (
  req,
  res
) => {
  try {
    await Resume.deleteMany({
      userId:
        req.user.userId,
    });

    await User.findByIdAndDelete(
      req.user.userId
    );

    res.clearCookie(
      "refreshToken"
    );

    return res.json({
      success: true,
      message:
        "Account deleted.",
    });
  } catch (error) {
    console.error(
      "Delete account error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to delete account.",
    });
  }
};