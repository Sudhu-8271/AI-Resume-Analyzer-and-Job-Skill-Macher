const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  code: { type: String },
  expiresAt: { type: Date },
  attempts: { type: Number, default: 0 },
  purpose: { type: String, default: 'auth' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SkillSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80 },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' }
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  degree: { type: String, trim: true, maxlength: 120 },
  fieldOfStudy: { type: String, trim: true, maxlength: 120 },
  institution: { type: String, trim: true, maxlength: 160 },
  startYear: { type: Number, min: 1900, max: 2200 },
  graduationYear: { type: Number, min: 1900, max: 2200 },
  score: { type: String, trim: true, maxlength: 30 }
});

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, trim: true, maxlength: 160 },
  jobTitle: { type: String, trim: true, maxlength: 120 },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', ''], default: '' },
  startDate: Date,
  endDate: Date,
  currentlyWorking: { type: Boolean, default: false },
  responsibilities: { type: String, maxlength: 3000 },
  achievements: { type: String, maxlength: 3000 }
});

const ProfileSchema = new mongoose.Schema({
  headline: { type: String, trim: true, maxlength: 160 },
  location: { type: String, trim: true, maxlength: 120 },
  currentRole: { type: String, trim: true, maxlength: 120 },
  careerLevel: { type: String, enum: ['Fresher', 'Entry Level', 'Mid Level', 'Senior Level', ''] , default: '' },
  yearsOfExperience: { type: Number, min: 0, max: 80, default: 0 },
  preferredRole: { type: String, trim: true, maxlength: 120 },
  preferredIndustry: { type: String, trim: true, maxlength: 120 },
  technicalSkills: [SkillSchema],
  softSkills: [SkillSchema],
  programmingLanguages: [SkillSchema],
  tools: [SkillSchema],
  education: [EducationSchema],
  experience: [ExperienceSchema],
  careerPreferences: {
    desiredRole: String,
    preferredLocation: String,
    workMode: { type: String, enum: ['Remote', 'Hybrid', 'On-site', ''] , default: '' },
    expectedSalary: String,
    preferredCompanies: [String],
    noticePeriod: String
  }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  notifications: {
    resumeAnalysisComplete: { type: Boolean, default: true }, atsScoreUpdates: { type: Boolean, default: true },
    jobRecommendations: { type: Boolean, default: true }, careerInsights: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true }, securityAlerts: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true }, pushNotifications: { type: Boolean, default: false }
  },
  aiPreferences: { defaultResume: String, autoAnalyze: Boolean, suggestSkills: Boolean, suggestRoles: Boolean, careerRecommendations: Boolean },
  privacy: { profileVisibility: { type: String, enum: ['Private', 'Connections', 'Public'], default: 'Private' }, resumeVisibility: { type: String, enum: ['Private', 'Public'], default: 'Private' }, allowAiAnalysis: { type: Boolean, default: true }, dataUsage: { type: Boolean, default: true } },
  appearance: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  language: { type: String, enum: ['en', 'hi'], default: 'en' },
  recommendationFrequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Never'], default: 'Weekly' }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true, sparse: true, trim: true },
  email: { type: String, index: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, index: true, sparse: true, trim: true },
  name: { type: String, trim: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null },
  provider: { type: String, default: 'local' },
  isVerified: { type: Boolean, default: false },
  termsAccepted: { type: Boolean, default: false },
  otp: OTPSchema,
  refreshTokens: [{ token: String, createdAt: Date }],
  lastOtpSentAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  profile: { type: ProfileSchema, default: () => ({}) },
  settings: { type: SettingsSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
