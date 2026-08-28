import React, { useEffect, useState } from 'react';
import './AccountPages.css';

const API =
  process.env.REACT_APP_API_URL || 'http://localhost:5001';

const emptyEducation = {
  degree: '',
  fieldOfStudy: '',
  institution: '',
  startYear: '',
  graduationYear: '',
  score: '',
};

const emptyExperience = {
  company: '',
  jobTitle: '',
  employmentType: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  responsibilities: '',
  achievements: '',
};

const skillGroups = [
  ['technicalSkills', 'Technical Skills'],
  ['softSkills', 'Soft Skills'],
  ['programmingLanguages', 'Programming Languages'],
  ['tools', 'Tools & Technologies'],
];

/* ================================================= */
/* API HELPER                                        */
/* ================================================= */

function api(path, options = {}) {
  const token = localStorage.getItem('authToken');

  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : {
            'Content-Type': 'application/json',
          }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });
}

/* ================================================= */
/* HELPERS                                           */
/* ================================================= */

function getAvatarLetter(username = '') {
  const value = String(username || '').trim();

  return value
    ? value.charAt(0).toUpperCase()
    : 'U';
}

function clean(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      clean(value) !== ''
    ) {
      return value;
    }
  }

  return '';
}

function normalizeSkill(skill) {
  if (!skill) return null;

  if (typeof skill === 'string') {
    const name = clean(skill);

    if (!name) return null;

    return {
      name,
      proficiency: 'Intermediate',
    };
  }

  if (typeof skill === 'object') {
    const name = firstValue(
      skill.name,
      skill.skill,
      skill.title,
      skill.value
    );

    if (!name) return null;

    return {
      name: clean(name),
      proficiency:
        skill.proficiency ||
        'Intermediate',
    };
  }

  return null;
}

function normalizeSkills(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  const result = [];

  values.forEach((item) => {
    const skill = normalizeSkill(item);

    if (!skill) return;

    const exists = result.some(
      (x) =>
        x.name.toLowerCase() ===
        skill.name.toLowerCase()
    );

    if (!exists) {
      result.push(skill);
    }
  });

  return result;
}

function mergeSkills(existing = [], incoming = []) {
  const result = normalizeSkills(existing);

  normalizeSkills(incoming).forEach(
    (skill) => {
      const exists = result.some(
        (x) =>
          x.name.toLowerCase() ===
          skill.name.toLowerCase()
      );

      if (!exists) {
        result.push(skill);
      }
    }
  );

  return result;
}

/* ================================================= */
/* RESUME DATA EXTRACTION                            */
/* ================================================= */

/*
 * Backend agar extractedData / parsedData bhejta hai
 * to ye directly use karega.
 *
 * Agar sirf resumeText available hai to basic
 * extraction bhi try karega.
 */

function getResumeParsedData(resume) {
  if (!resume) {
    return {};
  }

  return (
    resume.extractedData ||
    resume.parsedData ||
    resume.extracted ||
    resume.resumeData ||
    resume.profileData ||
    {}
  );
}

function parseYears(text) {
  if (!text) return '';

  const match = text.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i
  );

  return match ? match[1] : '';
}

function parseResumeTextFallback(resumeText) {
  if (!resumeText) {
    return {};
  }

  const text = String(resumeText);

  const result = {};

  const years = parseYears(text);

  if (years) {
    result.yearsOfExperience = years;
  }

  /*
   * Basic section detection.
   * Structured extraction backend se aaye to
   * woh is fallback se priority lega.
   */

  const lower = text.toLowerCase();

  if (
    lower.includes('bachelor') ||
    lower.includes('b.tech') ||
    lower.includes('btech') ||
    lower.includes('b.e.') ||
    lower.includes('bca')
  ) {
    result.educationHint = true;
  }

  return result;
}

/* ================================================= */
/* RESUME -> PROFILE MAPPER                          */
/* ================================================= */

function buildProfileFromResume(
  resume,
  currentProfile = {}
) {
  if (!resume) {
    return currentProfile;
  }

  const parsed =
    getResumeParsedData(resume);

  const fallback =
    parseResumeTextFallback(
      resume.resumeText
    );

  const next = {
    ...currentProfile,
  };

  /*
   * -------------------------------------------------
   * SKILLS
   * -------------------------------------------------
   */

  const technicalIncoming =
    firstValue(
      parsed.technicalSkills,
      parsed.skills?.technical,
      parsed.skills?.technicalSkills
    );

  const softIncoming =
    firstValue(
      parsed.softSkills,
      parsed.skills?.soft,
      parsed.skills?.softSkills
    );

  const programmingIncoming =
    firstValue(
      parsed.programmingLanguages,
      parsed.skills?.programmingLanguages,
      parsed.skills?.languages
    );

  const toolsIncoming =
    firstValue(
      parsed.tools,
      parsed.toolsAndTechnologies,
      parsed.skills?.tools,
      parsed.skills?.toolsAndTechnologies
    );

  /*
   * resumeSkills backend se already extracted
   * skillsList ke form me aa rahe hain.
   *
   * Inko technical skills me add karenge.
   */

  const resumeSkills =
    Array.isArray(resume.resumeSkills)
      ? resume.resumeSkills
      : [];

  next.technicalSkills =
    mergeSkills(
      currentProfile.technicalSkills || [],
      [
        ...(Array.isArray(
          technicalIncoming
        )
          ? technicalIncoming
          : []),
        ...resumeSkills,
      ]
    );

  next.softSkills =
    mergeSkills(
      currentProfile.softSkills || [],
      Array.isArray(softIncoming)
        ? softIncoming
        : []
    );

  next.programmingLanguages =
    mergeSkills(
      currentProfile.programmingLanguages ||
        [],
      Array.isArray(
        programmingIncoming
      )
        ? programmingIncoming
        : []
    );

  next.tools =
    mergeSkills(
      currentProfile.tools || [],
      Array.isArray(toolsIncoming)
        ? toolsIncoming
        : []
    );

  /*
   * -------------------------------------------------
   * PROFESSIONAL INFORMATION
   * -------------------------------------------------
   */

  next.headline = firstValue(
    currentProfile.headline,
    parsed.headline,
    parsed.professionalHeadline,
    parsed.summary
  );

  next.currentRole = firstValue(
    currentProfile.currentRole,
    parsed.currentRole,
    parsed.currentJobRole,
    parsed.jobTitle,
    parsed.currentPosition
  );

  next.location = firstValue(
    currentProfile.location,
    parsed.location,
    parsed.address,
    parsed.city
  );

  next.preferredRole = firstValue(
    currentProfile.preferredRole,
    parsed.preferredRole,
    parsed.targetRole
  );

  next.preferredIndustry =
    firstValue(
      currentProfile.preferredIndustry,
      parsed.preferredIndustry,
      parsed.industry
    );

  const experienceYears =
    firstValue(
      currentProfile.yearsOfExperience,
      parsed.yearsOfExperience,
      parsed.experienceYears,
      fallback.yearsOfExperience
    );

  if (
    experienceYears !== '' &&
    experienceYears !== null &&
    experienceYears !== undefined
  ) {
    next.yearsOfExperience =
      experienceYears;
  }

  /*
   * Career level.
   */

  const careerLevel =
    firstValue(
      currentProfile.careerLevel,
      parsed.careerLevel
    );

  if (careerLevel) {
    const allowed = [
      'Fresher',
      'Entry Level',
      'Mid Level',
      'Senior Level',
    ];

    const matched = allowed.find(
      (item) =>
        item.toLowerCase() ===
        String(careerLevel)
          .toLowerCase()
    );

    if (matched) {
      next.careerLevel = matched;
    }
  }

  /*
   * -------------------------------------------------
   * EDUCATION
   * -------------------------------------------------
   */

  const incomingEducation =
    parsed.education ||
    parsed.educations ||
    parsed.academicDetails ||
    [];

  if (
    Array.isArray(incomingEducation) &&
    incomingEducation.length
  ) {
    next.education =
      incomingEducation
        .map((item) => ({
          degree: firstValue(
            item.degree,
            item.qualification,
            item.course,
            item.program
          ),

          fieldOfStudy: firstValue(
            item.fieldOfStudy,
            item.field,
            item.specialization,
            item.major
          ),

          institution: firstValue(
            item.institution,
            item.university,
            item.college,
            item.school
          ),

          startYear:
            firstValue(
              item.startYear,
              item.startDate,
              item.from
            ) || '',

          graduationYear:
            firstValue(
              item.graduationYear,
              item.endYear,
              item.endDate,
              item.to
            ) || '',

          score: firstValue(
            item.score,
            item.cgpa,
            item.percentage,
            item.grade
          ),
        }))
        .filter(
          (item) =>
            item.degree ||
            item.fieldOfStudy ||
            item.institution
        );
  }

  /*
   * -------------------------------------------------
   * EXPERIENCE
   * -------------------------------------------------
   */

  const incomingExperience =
    parsed.experience ||
    parsed.experiences ||
    parsed.workExperience ||
    parsed.workHistory ||
    [];

  if (
    Array.isArray(incomingExperience) &&
    incomingExperience.length
  ) {
    next.experience =
      incomingExperience
        .map((item) => ({
          company: firstValue(
            item.company,
            item.companyName,
            item.organization,
            item.employer
          ),

          jobTitle: firstValue(
            item.jobTitle,
            item.title,
            item.role,
            item.position
          ),

          employmentType: firstValue(
            item.employmentType,
            item.type
          ),

          startDate: firstValue(
            item.startDate,
            item.from,
            item.start
          ),

          endDate: firstValue(
            item.endDate,
            item.to,
            item.end
          ),

          currentlyWorking:
            Boolean(
              item.currentlyWorking ||
                item.current ||
                item.present
            ),

          responsibilities:
            firstValue(
              item.responsibilities,
              item.description,
              item.duties
            ),

          achievements:
            firstValue(
              item.achievements,
              item.accomplishments
            ),
        }))
        .filter(
          (item) =>
            item.company ||
            item.jobTitle
        );
  }

  return next;
}

/* ================================================= */
/* SECTION                                           */
/* ================================================= */

function Section({
  title,
  children,
  action,
}) {
  return (
    <section className="account-section">
      <div className="section-heading">
        <h2>{title}</h2>

        {action}
      </div>

      {children}
    </section>
  );
}

/* ================================================= */
/* FIELD                                             */
/* ================================================= */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={value ?? ''}
        onChange={(e) =>
          onChange(e.target.value)
        }
        {...props}
      />
    </label>
  );
}

/* ================================================= */
/* SKILL EDITOR                                      */
/* ================================================= */

function SkillEditor({
  label,
  values = [],
  onChange,
}) {
  const [value, setValue] =
    useState('');

  const addSkill = () => {
    const name = value.trim();

    if (!name) return;

    const alreadyExists =
      values.some(
        (skill) =>
          skill.name?.toLowerCase() ===
          name.toLowerCase()
      );

    if (!alreadyExists) {
      onChange([
        ...values,
        {
          name,
          proficiency: 'Intermediate',
        },
      ]);
    }

    setValue('');
  };

  return (
    <div className="skill-editor">
      <div className="muted-label">
        {label}
      </div>

      <div className="skill-list">
        {values.map(
          (skill, index) => (
            <span
              className="skill-badge"
              key={`${skill.name}-${index}`}
            >
              {skill.name}

              <button
                type="button"
                onClick={() =>
                  onChange(
                    values.filter(
                      (_, i) =>
                        i !== index
                    )
                  )
                }
                aria-label={`Remove ${skill.name}`}
              >
                ×
              </button>
            </span>
          )
        )}
      </div>

      <div className="inline-form">
        <input
          value={value}
          placeholder="Add a real skill"
          onChange={(e) =>
            setValue(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
        />

        <button
          type="button"
          className="button-secondary"
          onClick={addSkill}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ================================================= */
/* PROFILE PAGE                                      */
/* ================================================= */

export default function ProfilePage() {
  const [data, setData] =
    useState({
      profile: {},
      name: '',
      username: '',
      email: '',
      phone: '',
    });

  const [resume, setResume] =
    useState(null);

  const [education, setEducation] =
    useState([]);

  const [experience, setExperience] =
    useState([]);

  const [
    editingEducation,
    setEditingEducation,
  ] = useState(null);

  const [
    editingExperience,
    setEditingExperience,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const profile =
    data.profile || {};

  /* ================================================= */
  /* LOAD PROFILE                                     */
  /* ================================================= */

  const loadProfile =
    async (
      shouldApplyResume = true
    ) => {
      try {
        setError('');

        const response =
          await api(
            '/api/profile'
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Unable to load profile.'
          );
        }

        const user =
          result.user || {};

        let loadedProfile =
          user.profile || {};

        /*
         * IMPORTANT:
         *
         * Resume se extracted data profile
         * me merge kar rahe hain.
         */

        if (
          shouldApplyResume &&
          result.resume
        ) {
          loadedProfile =
            buildProfileFromResume(
              result.resume,
              loadedProfile
            );
        }

        setData({
          profile:
            loadedProfile,

          name:
            user.name || '',

          username:
            user.username || '',

          email:
            user.email || '',

          phone:
            user.phone || '',
        });

        setResume(
          result.resume || null
        );

        setEducation(
          loadedProfile.education ||
            []
        );

        setExperience(
          loadedProfile.experience ||
            []
        );

        /*
         * Agar resume se new data mila hai,
         * backend me bhi save kar do.
         *
         * Isse next refresh par bhi data
         * available rahega.
         */

        if (
          shouldApplyResume &&
          result.resume
        ) {
          await saveResumeProfile(
            user,
            loadedProfile
          );
        }
      } catch (err) {
        setError(
          err.message ||
            'Unable to load profile.'
        );
      } finally {
        setLoading(false);
      }
    };

  /* ================================================= */
  /* SAVE RESUME EXTRACTED PROFILE                    */
  /* ================================================= */

  const saveResumeProfile =
    async (
      user,
      loadedProfile
    ) => {
      try {
        const response =
          await api(
            '/api/profile',
            {
              method: 'PUT',

              body: JSON.stringify({
                name:
                  user.name || '',

                username:
                  user.username ||
                  '',

                phone:
                  user.phone || '',

                ...loadedProfile,

                education:
                  loadedProfile.education ||
                  [],

                experience:
                  loadedProfile.experience ||
                  [],
              }),
            }
          );

        /*
         * Do not show error if this
         * background sync fails.
         *
         * User can still manually save.
         */

        if (!response.ok) {
          console.warn(
            'Resume profile sync failed.'
          );
        }
      } catch (err) {
        console.warn(
          'Resume profile sync error:',
          err
        );
      }
    };

  useEffect(() => {
    loadProfile(true);
  }, []);

  /* ================================================= */
  /* UPDATE PROFILE                                   */
  /* ================================================= */

  const updateProfile = (
    key,
    value
  ) => {
    setData((current) => ({
      ...current,

      profile: {
        ...(current.profile || {}),
        [key]: value,
      },
    }));
  };

  /* ================================================= */
  /* SAVE PROFILE                                     */
  /* ================================================= */

  const save = async (
    event
  ) => {
    if (event) {
      event.preventDefault();
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response =
        await api(
          '/api/profile',
          {
            method: 'PUT',

            body: JSON.stringify({
              name: data.name,
              username: data.username,
              phone: data.phone,

              ...profile,

              education,
              experience,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Unable to save profile.'
        );
      }

      const user =
        result.user || {};

      setData({
        profile:
          user.profile ||
          profile,

        name:
          user.name ||
          data.name,

        username:
          user.username ||
          data.username,

        email:
          user.email ||
          data.email,

        phone:
          user.phone ||
          data.phone,
      });

      setEducation(
        user.profile?.education ||
          education
      );

      setExperience(
        user.profile?.experience ||
          experience
      );

      setMessage(
        'Profile saved successfully.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Unable to save profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================================================= */
  /* RESUME UPLOAD                                    */
  /* ================================================= */

  const upload = async (
    file
  ) => {
    if (!file) return;

    try {
      setError('');
      setMessage('');

      const form =
        new FormData();

      form.append(
        'resume',
        file
      );

      const response =
        await api(
          '/api/profile/resume',
          {
            method: 'POST',
            body: form,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Resume upload failed.'
        );
      }

      setResume(
        result.resume || null
      );

      /*
       * IMPORTANT:
       *
       * Upload ke baad complete profile
       * dobara fetch karenge.
       *
       * Backend extracted data provide
       * karega to yahan automatically
       * populate hoga.
       */

      await loadProfile(true);

      setMessage(
        'Resume uploaded and profile data refreshed successfully.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Resume upload failed.'
      );
    }
  };

  /* ================================================= */
  /* DOWNLOAD RESUME                                  */
  /* ================================================= */

  const download =
    async () => {
      try {
        setError('');

        const response =
          await api(
            '/api/profile/resume/download'
          );

        if (!response.ok) {
          setError(
            'No downloadable resume is available.'
          );
          return;
        }

        const blob =
          await response.blob();

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            'a'
          );

        link.href = url;

        link.download =
          resume?.fileName ||
          'resume.pdf';

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
          url
        );
      } catch (err) {
        setError(
          err.message ||
            'Unable to download resume.'
        );
      }
    };

  /* ================================================= */
  /* REMOVE RESUME                                    */
  /* ================================================= */

  const removeResume =
    async () => {
      const confirmed =
        window.confirm(
          'Remove your stored resume and analysis data? This cannot be undone.'
        );

      if (!confirmed) return;

      try {
        setError('');
        setMessage('');

        const response =
          await api(
            '/api/profile/resume',
            {
              method: 'DELETE',
            }
          );

        const result =
          response.ok
            ? {}
            : await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Unable to remove resume.'
          );
        }

        setResume(null);

        setMessage(
          'Resume data removed.'
        );
      } catch (err) {
        setError(
          err.message ||
            'Unable to remove resume.'
        );
      }
    };

  /* ================================================= */
  /* LOADING                                          */
  /* ================================================= */

  if (loading) {
    return (
      <main className="account-page">
        <div className="loading-state">
          Loading your profile...
        </div>
      </main>
    );
  }

  /* ================================================= */
  /* UI                                               */
  /* ================================================= */

  return (
    <main className="account-page">

      <div className="page-title">
        <div>
          <p className="eyebrow">
            ACCOUNT
          </p>

          <h1>
            My Profile
          </h1>

          <p className="subtitle">
            Keep your professional identity
            and career data current.
          </p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : 'Save Profile'}
        </button>
      </div>

      {message && (
        <div className="notice success">
          {message}
        </div>
      )}

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <form onSubmit={save}>

        {/* ================================================= */}
        {/* PROFILE HERO                                     */}
        {/* ================================================= */}

        <section className="profile-hero">

          <div className="avatar">
            {getAvatarLetter(
              data.username
            )}
          </div>

          <div className="hero-copy">

            <h2>
              {data.username ||
                data.name ||
                'Your username'}
            </h2>

            <p>
              {data.username
                ? `@${data.username}`
                : '@username'}

              {' · '}

              {profile.headline ||
                'Add a professional headline'}
            </p>

            <span>
              {data.email ||
                'Add your email'}
            </span>

          </div>
        </section>

        {/* ================================================= */}
        {/* PERSONAL INFORMATION                             */}
        {/* ================================================= */}

        <Section title="Personal Information">

          <div className="form-grid">

            <Field
              label="Full Name"
              value={data.name}
              onChange={(value) =>
                setData((current) => ({
                  ...current,
                  name: value,
                }))
              }
              required
            />

            <Field
              label="Username"
              value={data.username}
              onChange={(value) =>
                setData((current) => ({
                  ...current,
                  username: value,
                }))
              }
              required
            />

            <label className="field">
              <span>
                Email
              </span>

              <input
                type="email"
                value={
                  data.email || ''
                }
                disabled
              />
            </label>

            <label className="field">
              <span>
                Phone
              </span>

              <input
                type="tel"
                value={
                  data.phone || ''
                }
                onChange={(e) =>
                  setData((current) => ({
                    ...current,
                    phone:
                      e.target.value,
                  }))
                }
              />
            </label>

            <Field
              label="Location"
              value={
                profile.location
              }
              onChange={(value) =>
                updateProfile(
                  'location',
                  value
                )
              }
            />

          </div>
        </Section>

        {/* ================================================= */}
        {/* PROFESSIONAL INFORMATION                         */}
        {/* ================================================= */}

        <Section title="Professional Information">

          <div className="form-grid">

            <Field
              label="Professional Headline"
              value={
                profile.headline
              }
              onChange={(value) =>
                updateProfile(
                  'headline',
                  value
                )
              }
            />

            <Field
              label="Current Job Role"
              value={
                profile.currentRole
              }
              onChange={(value) =>
                updateProfile(
                  'currentRole',
                  value
                )
              }
            />

            <label className="field">
              <span>
                Career Level
              </span>

              <select
                value={
                  profile.careerLevel ||
                  ''
                }
                onChange={(e) =>
                  updateProfile(
                    'careerLevel',
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select level
                </option>

                {[
                  'Fresher',
                  'Entry Level',
                  'Mid Level',
                  'Senior Level',
                ].map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="Years of Experience"
              type="number"
              min="0"
              max="80"
              value={
                profile.yearsOfExperience
              }
              onChange={(value) =>
                updateProfile(
                  'yearsOfExperience',
                  value
                )
              }
            />

            <Field
              label="Preferred Job Role"
              value={
                profile.preferredRole
              }
              onChange={(value) =>
                updateProfile(
                  'preferredRole',
                  value
                )
              }
            />

            <Field
              label="Preferred Industry"
              value={
                profile.preferredIndustry
              }
              onChange={(value) =>
                updateProfile(
                  'preferredIndustry',
                  value
                )
              }
            />

          </div>
        </Section>

        {/* ================================================= */}
        {/* SKILLS                                           */}
        {/* ================================================= */}

        <Section title="Skills">

          <div className="skills-grid">

            {skillGroups.map(
              ([key, label]) => (
                <SkillEditor
                  key={key}
                  label={label}
                  values={
                    profile[key] || []
                  }
                  onChange={(value) =>
                    updateProfile(
                      key,
                      value
                    )
                  }
                />
              )
            )}

          </div>
        </Section>

        {/* ================================================= */}
        {/* EDUCATION                                        */}
        {/* ================================================= */}

        <Section
          title="Education"
          action={
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setEditingEducation({
                  ...emptyEducation,
                })
              }
            >
              + Add Education
            </button>
          }
        >

          {editingEducation && (
            <div className="editor-box">

              <div className="form-grid">

                {[
                  [
                    'degree',
                    'Degree',
                  ],
                  [
                    'fieldOfStudy',
                    'Field of Study',
                  ],
                  [
                    'institution',
                    'College / University',
                  ],
                  [
                    'startYear',
                    'Start Year',
                  ],
                  [
                    'graduationYear',
                    'Graduation Year',
                  ],
                  [
                    'score',
                    'CGPA / Percentage',
                  ],
                ].map(
                  ([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      value={
                        editingEducation[
                          key
                        ]
                      }
                      onChange={(value) =>
                        setEditingEducation(
                          (current) => ({
                            ...current,
                            [key]:
                              value,
                          })
                        )
                      }
                    />
                  )
                )}

              </div>

              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  setEducation(
                    (current) => [
                      ...current,
                      editingEducation,
                    ]
                  );

                  setEditingEducation(
                    null
                  );
                }}
              >
                Add Entry
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setEditingEducation(
                    null
                  )
                }
              >
                Cancel
              </button>

            </div>
          )}

          {education.length ? (
            education.map(
              (item, index) => (
                <div
                  className="list-item"
                  key={index}
                >
                  <div>

                    <strong>
                      {item.degree ||
                        'Degree'}
                    </strong>

                    <p>
                      {item.fieldOfStudy}
                      {item.fieldOfStudy &&
                        item.institution
                        ? ' · '
                        : ''}
                      {item.institution}
                    </p>

                    <small>
                      {item.startYear ||
                        ''}
                      {(item.startYear ||
                        item.graduationYear) &&
                        ' - '}
                      {item.graduationYear ||
                        ''}

                      {item.score
                        ? ` · ${item.score}`
                        : ''}
                    </small>

                  </div>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setEducation(
                        (current) =>
                          current.filter(
                            (_, i) =>
                              i !==
                              index
                          )
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              )
            )
          ) : (
            <div className="empty-state">
              Add education details to
              strengthen your profile.
            </div>
          )}

        </Section>

        {/* ================================================= */}
        {/* EXPERIENCE                                       */}
        {/* ================================================= */}

        <Section
          title="Work Experience"
          action={
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setEditingExperience({
                  ...emptyExperience,
                })
              }
            >
              + Add Experience
            </button>
          }
        >

          {editingExperience && (
            <div className="editor-box">

              <div className="form-grid">

                {[
                  [
                    'company',
                    'Company',
                  ],
                  [
                    'jobTitle',
                    'Job Title',
                  ],
                  [
                    'startDate',
                    'Start Date',
                  ],
                  [
                    'endDate',
                    'End Date',
                  ],
                ].map(
                  ([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      type={
                        key.includes(
                          'Date'
                        )
                          ? 'date'
                          : 'text'
                      }
                      value={
                        editingExperience[
                          key
                        ]
                      }
                      onChange={(value) =>
                        setEditingExperience(
                          (current) => ({
                            ...current,
                            [key]:
                              value,
                          })
                        )
                      }
                    />
                  )
                )}

                <label className="field">
                  <span>
                    Employment Type
                  </span>

                  <select
                    value={
                      editingExperience.employmentType ||
                      ''
                    }
                    onChange={(e) =>
                      setEditingExperience(
                        (current) => ({
                          ...current,
                          employmentType:
                            e.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="">
                      Select type
                    </option>

                    {[
                      'Full-time',
                      'Part-time',
                      'Contract',
                      'Internship',
                      'Freelance',
                    ].map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={
                      editingExperience.currentlyWorking ||
                      false
                    }
                    onChange={(e) =>
                      setEditingExperience(
                        (current) => ({
                          ...current,
                          currentlyWorking:
                            e.target
                              .checked,
                        })
                      )
                    }
                  />

                  Currently working
                </label>

              </div>

              <label className="field">
                <span>
                  Responsibilities
                </span>

                <textarea
                  value={
                    editingExperience.responsibilities ||
                    ''
                  }
                  onChange={(e) =>
                    setEditingExperience(
                      (current) => ({
                        ...current,
                        responsibilities:
                          e.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label className="field">
                <span>
                  Achievements
                </span>

                <textarea
                  value={
                    editingExperience.achievements ||
                    ''
                  }
                  onChange={(e) =>
                    setEditingExperience(
                      (current) => ({
                        ...current,
                        achievements:
                          e.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  setExperience(
                    (current) => [
                      ...current,
                      editingExperience,
                    ]
                  );

                  setEditingExperience(
                    null
                  );
                }}
              >
                Add Entry
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setEditingExperience(
                    null
                  )
                }
              >
                Cancel
              </button>

            </div>
          )}

          {experience.length ? (
            experience.map(
              (item, index) => (
                <div
                  className="list-item timeline"
                  key={index}
                >

                  <div>

                    <strong>
                      {item.jobTitle ||
                        'Job title'}
                    </strong>

                    <p>
                      {item.company}

                      {item.company &&
                        item.employmentType
                        ? ' · '
                        : ''}

                      {item.employmentType}
                    </p>

                    <small>
                      {item.startDate ||
                        'Start'}

                      {' - '}

                      {item.currentlyWorking
                        ? 'Present'
                        : item.endDate ||
                          'End'}
                    </small>

                    {item.responsibilities && (
                      <p>
                        {
                          item.responsibilities
                        }
                      </p>
                    )}

                  </div>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setExperience(
                        (current) =>
                          current.filter(
                            (_, i) =>
                              i !==
                              index
                          )
                      )
                    }
                  >
                    Delete
                  </button>

                </div>
              )
            )
          ) : (
            <div className="empty-state">
              Your work history will
              appear as a career timeline.
            </div>
          )}

        </Section>

        {/* ================================================= */}
        {/* RESUME                                           */}
        {/* ================================================= */}

        <Section title="Resume">

          <div className="resume-panel">

            {resume ? (
              <>
                <div>
                  <strong>
                    {resume.fileName ||
                      'Uploaded resume'}
                  </strong>

                  <p>
                    Uploaded{' '}
                    {resume.createdAt ||
                    resume.updatedAt
                      ? new Date(
                          resume.createdAt ||
                            resume.updatedAt
                        ).toLocaleDateString()
                      : ''}
                  </p>
                </div>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={download}
                >
                  Download
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={removeResume}
                >
                  Remove
                </button>
              </>
            ) : (
              <div className="empty-state">
                No resume stored yet.
              </div>
            )}

            <label className="upload-button">

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];

                  if (file) {
                    upload(file);
                  }

                  e.target.value = '';
                }}
              />

              {resume
                ? 'Replace Resume'
                : 'Upload Resume'}

            </label>

          </div>
        </Section>

        {/* ================================================= */}
        {/* SAVE                                              */}
        {/* ================================================= */}

        <div className="form-actions">

          <button
            className="button-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Profile'}
          </button>

        </div>

      </form>
    </main>
  );
}