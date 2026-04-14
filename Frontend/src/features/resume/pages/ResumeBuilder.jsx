import React, { useState, useEffect } from 'react';
import '../style/resumeBuilder.scss';
import { saveResume, enhanceContent, downloadResumePdf, getResumes, getResumeById, deleteResume } from '../services/resume.api';
import { useNavigate } from 'react-router';
import ResumePreview from '../components/ResumePreview';

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [savedLoading, setSavedLoading] = useState(false);
    const [error, setError] = useState("");
    const [enhancing, setEnhancing] = useState({});
    const [savedResumes, setSavedResumes] = useState([]);

    const [resumeData, setResumeData] = useState({
        title: 'Untitled Resume',
        template: 'modern',
        personalInfo: { name: '', email: '', phone: '', location: '' },
        summary: '',
        experience: [],
        education: [],
        projects: [],
        skills: [],
        links: []
    });

    const handleChange = (section, field, value, index = null) => {
        setResumeData(prev => {
            if (index !== null) {
                const newArr = [...prev[section]];
                newArr[index] = { ...newArr[index], [field]: value };
                return { ...prev, [section]: newArr };
            }
            if (section === 'personalInfo') {
                return { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } };
            }
            return { ...prev, [section]: value };
        });
    };

    const addListItem = (section, defaultObj) => {
        setResumeData(prev => ({ ...prev, [section]: [...prev[section], defaultObj] }));
    };

    const removeListItem = (section, index) => {
        setResumeData(prev => {
            const newArr = [...prev[section]];
            newArr.splice(index, 1);
            return { ...prev, [section]: newArr };
        });
    };

    const [skillInput, setSkillInput] = useState("");
    const addSkill = (e) => {
        e.preventDefault();
        if (skillInput.trim() && !resumeData.skills.includes(skillInput.trim())) {
            setResumeData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput("");
        }
    };
    const removeSkill = (index) => {
        setResumeData(prev => {
            const newSkills = [...prev.skills];
            newSkills.splice(index, 1);
            return { ...prev, skills: newSkills };
        });
    };

    const handleEnhance = async (section, index = null, field = null, content) => {
        if (!content) return;
        const keyId = index !== null ? `${section}-${index}-${field}` : section;
        setEnhancing(p => ({ ...p, [keyId]: true }));
        try {
            const result = await enhanceContent({ field: section, content });
            if (result.enhancedText) {
                if (index !== null) {
                    handleChange(section, field, result.enhancedText, index);
                } else if (section === 'summary') {
                    handleChange('summary', null, result.enhancedText);
                }
            }
        } catch (err) {
            console.error("Enhancement failed", err);
            alert("Failed to enhance content.");
        } finally {
            setEnhancing(p => ({ ...p, [keyId]: false }));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");

        if (!resumeData.personalInfo.name.trim() || !resumeData.personalInfo.email.trim()) {
            setError("Name and email are required before saving the resume.");
            setLoading(false);
            return;
        }

        try {
            const data = await saveResume(resumeData);
            if (data?.resume?._id) {
                setResumeData(prev => ({ ...prev, _id: data.resume._id }));
                setSavedResumes(prev => {
                    const existing = prev.find(item => item._id === data.resume._id);
                    if (existing) return prev;
                    return [data.resume, ...prev];
                });
            }
            alert("Resume Saved Successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save resume. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSaved = async () => {
            setSavedLoading(true);
            try {
                const data = await getResumes();
                setSavedResumes(data.resumes || []);
            } catch (err) {
                console.error("Unable to load saved resumes", err);
            } finally {
                setSavedLoading(false);
            }
        };

        fetchSaved();
    }, []);

    const handleSaveAndDownload = async () => {
        setLoading(true);
        setError("");

        if (!resumeData.personalInfo.name.trim() || !resumeData.personalInfo.email.trim()) {
            setError("Name and email are required before downloading the resume.");
            setLoading(false);
            return;
        }

        try {
            const data = await saveResume(resumeData);
            if (data?.resume?._id) {
                setResumeData(prev => ({ ...prev, _id: data.resume._id }));
                await downloadResumePdf(data.resume._id);
                setSavedResumes(prev => {
                    const existing = prev.find(item => item._id === data.resume._id);
                    if (existing) return prev;
                    return [data.resume, ...prev];
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save and download PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadDraft = async (id) => {
        setLoading(true);
        setError("");
        try {
            const data = await getResumeById(id);
            if (data?.resume) {
                setResumeData(data.resume);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load saved resume.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = async (id) => {
        if (!window.confirm("Delete this saved resume?")) return;
        setLoading(true);
        setError("");
        try {
            await deleteResume(id);
            setSavedResumes(prev => prev.filter(resume => resume._id !== id));
            if (resumeData._id === id) {
                setResumeData({
                    title: 'Untitled Resume',
                    template: 'modern',
                    personalInfo: { name: '', email: '', phone: '', location: '' },
                    summary: '',
                    experience: [],
                    education: [],
                    projects: [],
                    skills: [],
                    links: []
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete saved resume.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!resumeData.personalInfo.name.trim() || !resumeData.personalInfo.email.trim()) {
            setError("Please add your name and email before generating the PDF.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            if (resumeData._id) {
                await downloadResumePdf(resumeData._id);
            } else {
                await downloadResumePdf(null, resumeData);
            }
        } catch (err) {
             setError(err.response?.data?.message || "Unable to download PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="resume-builder">
            <header>
                <h1>Resume Builder</h1>
                <div className="header-actions">
                    <button className="button tertiary-button" disabled={loading} onClick={handleSaveAndDownload}>
                        {loading ? "Processing..." : "Save & Download"}
                    </button>
                    <button className="button secondary-button" disabled={loading} onClick={handleDownload}>
                         Download PDF
                    </button>
                    <button className="button primary-button" disabled={loading} onClick={handleSave}>
                        {loading ? "Saving..." : "Save Resume"}
                    </button>
                </div>
            </header>

            {error && <div className="error-text" style={{marginBottom: "1rem"}}>{error}</div>}

            <div className="builder-container">
                <div className="builder-sidebar">
                    <div className="card saved-resumes-card">
                        <h2>Saved Resumes</h2>
                        {savedLoading ? (
                            <p>Loading saved resumes...</p>
                        ) : savedResumes.length === 0 ? (
                            <p>No saved resumes yet.</p>
                        ) : (
                            <div className="saved-resume-list">
                                {savedResumes.map((resume) => (
                                    <div key={resume._id} className="saved-resume-item">
                                        <div>
                                            <strong>{resume.personalInfo?.name || resume.title}</strong>
                                            <p>{new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="saved-resume-actions">
                                            <button className="button tertiary-button" type="button" onClick={() => handleLoadDraft(resume._id)}>Load</button>
                                            <button className="button secondary-button" type="button" onClick={() => downloadResumePdf(resume._id)}>Download</button>
                                            <button className="button danger-button" type="button" onClick={() => handleDeleteResume(resume._id)}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Personal Info */}
                <div className="card">
                    <h2>Personal Information</h2>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={resumeData.personalInfo.name} onChange={(e) => handleChange('personalInfo', 'name', e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" value={resumeData.personalInfo.email} onChange={(e) => handleChange('personalInfo', 'email', e.target.value)} placeholder="john@example.com" />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" value={resumeData.personalInfo.phone} onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)} placeholder="+1 234 567 8900" />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input type="text" value={resumeData.personalInfo.location} onChange={(e) => handleChange('personalInfo', 'location', e.target.value)} placeholder="New York, USA" />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="card">
                    <h2>Professional Summary</h2>
                    <div className="form-group ai-enhance-wrap">
                        <textarea 
                            value={resumeData.summary} 
                            onChange={(e) => handleChange('summary', null, e.target.value)} 
                            placeholder="Briefly describe your career objectives and top achievements..." 
                        />
                        <button 
                            className="enhance-btn" 
                            disabled={enhancing['summary'] || !resumeData.summary}
                            onClick={() => handleEnhance('summary', null, null, resumeData.summary)}>
                            ✨ {enhancing['summary'] ? "Enhancing..." : "Enhance with AI"}
                        </button>
                    </div>
                </div>

                {/* Experience */}
                <div className="card">
                    <h2>Work Experience</h2>
                    <div className="dynamic-list">
                        {resumeData.experience.map((exp, i) => (
                            <div key={i} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeListItem('experience', i)}>×</button>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Company</label>
                                        <input type="text" value={exp.company} onChange={e => handleChange('experience', 'company', e.target.value, i)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Role / Title</label>
                                        <input type="text" value={exp.role} onChange={e => handleChange('experience', 'role', e.target.value, i)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="text" value={exp.startDate} onChange={e => handleChange('experience', 'startDate', e.target.value, i)} placeholder="e.g. Jan 2021" />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="text" value={exp.endDate} onChange={e => handleChange('experience', 'endDate', e.target.value, i)} placeholder="e.g. Present" />
                                    </div>
                                </div>
                                <div className="form-group ai-enhance-wrap" style={{marginTop: "1rem"}}>
                                    <label>Description</label>
                                    <textarea 
                                        value={exp.description} 
                                        onChange={e => handleChange('experience', 'description', e.target.value, i)} 
                                        placeholder="I made a website..."
                                    />
                                    <button 
                                        className="enhance-btn" 
                                        disabled={enhancing[`experience-${i}-description`] || !exp.description}
                                        onClick={() => handleEnhance('experience', i, 'description', exp.description)}>
                                        ✨ {enhancing[`experience-${i}-description`] ? "Enhancing..." : "Enhance with AI"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={() => addListItem('experience', {company: '', role: '', startDate: '', endDate: '', description: ''})}>
                            + Add Experience
                        </button>
                    </div>
                </div>

                {/* Education */}
                <div className="card">
                    <h2>Education</h2>
                    <div className="dynamic-list">
                        {resumeData.education.map((edu, i) => (
                            <div key={i} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeListItem('education', i)}>×</button>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Institution</label>
                                        <input type="text" value={edu.institution} onChange={e => handleChange('education', 'institution', e.target.value, i)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Degree</label>
                                        <input type="text" value={edu.degree} onChange={e => handleChange('education', 'degree', e.target.value, i)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Field of Study</label>
                                        <input type="text" value={edu.field} onChange={e => handleChange('education', 'field', e.target.value, i)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Graduation Year</label>
                                        <input type="text" value={edu.endDate} onChange={e => handleChange('education', 'endDate', e.target.value, i)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={() => addListItem('education', {institution: '', degree: '', field: '', startDate: '', endDate: ''})}>
                            + Add Education
                        </button>
                    </div>
                </div>

                {/* Projects */}
                <div className="card">
                    <h2>Projects</h2>
                    <div className="dynamic-list">
                        {resumeData.projects.map((proj, i) => (
                            <div key={i} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeListItem('projects', i)}>×</button>
                                <div className="form-group">
                                    <label>Project Name</label>
                                    <input type="text" value={proj.name} onChange={e => handleChange('projects', 'name', e.target.value, i)} />
                                </div>
                                <div className="form-group ai-enhance-wrap">
                                    <label>Description</label>
                                    <textarea 
                                        value={proj.description} 
                                        onChange={e => handleChange('projects', 'description', e.target.value, i)} 
                                        placeholder="Built an app using React and Node.js..."
                                    />
                                    <button 
                                        className="enhance-btn" 
                                        disabled={enhancing[`projects-${i}-description`] || !proj.description}
                                        onClick={() => handleEnhance('projects', i, 'description', proj.description)}>
                                        ✨ {enhancing[`projects-${i}-description`] ? "Enhancing..." : "Enhance with AI"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={() => addListItem('projects', {name: '', description: '', link: ''})}>
                            + Add Project
                        </button>
                    </div>
                </div>

                {/* Links */}
                <div className="card">
                    <h2>Social & Portfolio Links</h2>
                    <div className="dynamic-list">
                        {resumeData.links.map((link, i) => (
                            <div key={i} className="dynamic-item">
                                <button className="remove-btn" onClick={() => removeListItem('links', i)}>×</button>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Label</label>
                                        <input type="text" value={link.label} onChange={e => handleChange('links', 'label', e.target.value, i)} placeholder="e.g. LinkedIn" />
                                    </div>
                                    <div className="form-group">
                                        <label>URL</label>
                                        <input type="url" value={link.url} onChange={e => handleChange('links', 'url', e.target.value, i)} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="add-btn" onClick={() => addListItem('links', {label: '', url: ''})}>
                            + Add Link
                        </button>
                    </div>
                </div>

                {/* Skills */}
                <div className="card">
                    <h2>Skills</h2>
                    <div className="form-group tag-input-wrap">
                        <div className="tags">
                            {resumeData.skills.map((skill, i) => (
                                <span key={i} className="tag">
                                    {skill}
                                    <button onClick={() => removeSkill(i)}>×</button>
                                </span>
                            ))}
                        </div>
                        <form className="tag-input" onSubmit={addSkill}>
                            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill (e.g. React, Node.js) and press Enter" />
                            <button type="submit">Add</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div className="builder-preview">
                <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        </div>
    );
};

export default ResumeBuilder;
