const User = require('../models/User');

exports.getSettings = async (req, res) => {
  const user = await User.findById(req.user.userId).select('settings profile.careerPreferences');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ success: true, settings: user.settings || {}, careerPreferences: user.profile?.careerPreferences || {} });
};

exports.updateSettings = async (req, res) => {
  try {
    const allowed = ['notifications', 'aiPreferences', 'privacy', 'appearance', 'language', 'recommendationFrequency'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[`settings.${key}`] = req.body[key];
    if (req.body.careerPreferences !== undefined) updates['profile.careerPreferences'] = req.body.careerPreferences;
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true, runValidators: true }).select('settings profile.careerPreferences');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, settings: user.settings, careerPreferences: user.profile?.careerPreferences || {}, message: 'Settings saved.' });
  } catch (error) { res.status(400).json({ error: error.message || 'Unable to save settings.' }); }
};

exports.downloadData = async (req, res) => {
  const user = await User.findById(req.user.userId).select('-passwordHash -refreshTokens -otp -lastOtpSentAt');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ success: true, data: user });
};

module.exports = exports;
