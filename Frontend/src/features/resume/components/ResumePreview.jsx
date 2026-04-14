import React from 'react';
import '../style/resumePreview.scss';

const ResumePreview = ({ resumeData }) => {
    const { personalInfo, summary, experience, education, projects, skills, links } = resumeData;

    return (
        <div className="resume-preview-container">
            <div className="resume-preview-content">
                <header className="resume-header">
                    <div className="header-top">
                        <h1>{personalInfo?.name || 'Your Name'}</h1>
                        <div className="header-meta">
                            {personalInfo?.email && <span>{personalInfo.email}</span>}
                            {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                            {personalInfo?.location && <span>{personalInfo.location}</span>}
                        </div>
                    </div>

                    {links && links.length > 0 && (
                        <div className="social-links">
                            {links.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
                            ))}
                        </div>
                    )}
                </header>

                {summary && (
                    <section className="resume-section">
                        <h2>Professional Summary</h2>
                        <div className="section-content">
                            <p>{summary}</p>
                        </div>
                    </section>
                )}

                {experience && experience.length > 0 && (
                    <section className="resume-section">
                        <h2>Experience</h2>
                        <div className="section-content">
                            {experience.map((exp, idx) => (
                                <div key={idx} className="section-item">
                                    <div className="item-heading">
                                        <div>
                                            <h3>{exp.role || 'Role'}</h3>
                                            <p className="item-subtitle">{exp.company || 'Company'}</p>
                                        </div>
                                        <span className="item-date">{exp.startDate || ''}{exp.startDate && exp.endDate ? ' – ' : ''}{exp.endDate || ''}</span>
                                    </div>
                                    {exp.description && <p className="item-description">{exp.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects && projects.length > 0 && (
                    <section className="resume-section">
                        <h2>Projects</h2>
                        <div className="section-content">
                            {projects.map((proj, idx) => (
                                <div key={idx} className="section-item">
                                    <h3>{proj.name || 'Project Name'}</h3>
                                    {proj.description && <p className="item-description">{proj.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education && education.length > 0 && (
                    <section className="resume-section">
                        <h2>Education</h2>
                        <div className="section-content">
                            {education.map((edu, idx) => (
                                <div key={idx} className="section-item">
                                    <div className="item-heading">
                                        <div>
                                            <h3>{edu.institution || 'Institution'}</h3>
                                            <p className="item-subtitle">{edu.degree || 'Degree'}{edu.field ? ` in ${edu.field}` : ''}</p>
                                        </div>
                                        <span className="item-date">{edu.startDate || ''}{edu.startDate && edu.endDate ? ' – ' : ''}{edu.endDate || ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {skills && skills.length > 0 && (
                    <section className="resume-section">
                        <h2>Skills</h2>
                        <div className="skills-list">
                            {skills.map((skill, idx) => (
                                <span key={idx} className="skill-tag">{skill}</span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default ResumePreview;
