import React from 'react';
import '../style/resumePreview.scss';

const ResumePreview = ({ resumeData }) => {
    const { personalInfo, summary, experience, education, projects, skills, links } = resumeData;

    return (
        <div className="resume-preview-container">
            <div className="resume-preview-content">
                <header className="resume-header">
                    <h1>{personalInfo?.name || "Your Name"}</h1>
                    <div className="contact-links">
                        {personalInfo?.email && <span>{personalInfo.email}</span>}
                        {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                        {personalInfo?.location && <span>{personalInfo.location}</span>}
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
                        <p>{summary}</p>
                    </section>
                )}

                {experience && experience.length > 0 && (
                    <section className="resume-section">
                        <h2>Experience</h2>
                        <div className="experience-list">
                            {experience.map((exp, idx) => (
                                <div key={idx} className="experience-item">
                                    <div className="item-header">
                                        <h3 className="role-title">{exp.role || "Role"}</h3>
                                        <span className="dates">{exp.startDate} {exp.startDate && exp.endDate ? "-" : ""} {exp.endDate}</span>
                                    </div>
                                    <h4 className="company-name">{exp.company || "Company"}</h4>
                                    <p className="description">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education && education.length > 0 && (
                    <section className="resume-section">
                        <h2>Education</h2>
                        <div className="education-list">
                            {education.map((edu, idx) => (
                                <div key={idx} className="education-item">
                                    <div className="item-header">
                                        <h3 className="course-title">{edu.degree || "Degree"} {edu.field && `in ${edu.field}`}</h3>
                                        <span className="dates">{edu.startDate} {edu.startDate && edu.endDate ? "-" : ""} {edu.endDate}</span>
                                    </div>
                                    <h4 className="institution-name">{edu.institution || "Institution"}</h4>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects && projects.length > 0 && (
                    <section className="resume-section">
                        <h2>Projects</h2>
                        <div className="projects-list">
                            {projects.map((proj, idx) => (
                                <div key={idx} className="project-item">
                                    <h3 className="project-title">{proj.name || "Project Name"}</h3>
                                    <p className="description">{proj.description}</p>
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
