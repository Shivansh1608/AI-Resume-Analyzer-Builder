import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getResumes } from '../../resume/services/resume.api.js'

// ── Circular Score Ring ───────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
    const radius = 28
    const stroke = 5
    const normalizedRadius = radius - stroke
    const circumference = normalizedRadius * 2 * Math.PI
    const progress = score != null ? score / 100 : 0
    const strokeDashoffset = circumference - progress * circumference
    const color = score >= 80 ? '#00d4a1' : score >= 60 ? '#7c6cfc' : '#ff2d78'

    return (
        <div className='score-ring'>
            <svg height={radius * 2} width={radius * 2}>
                <circle
                    className='score-ring__track'
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    className='score-ring__fill'
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    style={{ stroke: color }}
                />
            </svg>
            <span className='score-ring__label' style={{ color }}>
                {score != null ? `${score}%` : '—'}
            </span>
        </div>
    )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ user, onNavigate, currentPath, onLogout }) => {
    const firstLetter = (user?.username || user?.name || user?.email || 'U')[0].toUpperCase()
    const [dropdownOpen, setDropdownOpen] = React.useState(false)
    const dropdownRef = React.useRef(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <nav className='dash-nav'>
            <div className='dash-nav__brand'>
                <span className='dash-nav__logo-icon'>N</span>
                <span className='dash-nav__logo-text'>Next<span>Hire</span></span>
            </div>
            <div className='dash-nav__links'>
                <button
                    className={`dash-nav__link ${currentPath === '/' ? 'dash-nav__link--active' : ''}`}
                    onClick={() => onNavigate('/')}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Dashboard
                </button>
                <button
                    className={`dash-nav__link ${currentPath === '/resume-builder' ? 'dash-nav__link--active' : ''}`}
                    onClick={() => onNavigate('/resume-builder')}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Resume Builder
                </button>
            </div>

            {/* User Dropdown */}
            <div className='dash-nav__user' ref={dropdownRef}>
                <button
                    className='dash-nav__user-btn'
                    onClick={() => setDropdownOpen(o => !o)}
                    aria-expanded={dropdownOpen}
                >
                    <div className='dash-nav__avatar'>{firstLetter}</div>
                    <span className='dash-nav__username'>{user?.username || user?.name || user?.email}</span>
                    <svg className={`dash-nav__chevron ${dropdownOpen ? 'dash-nav__chevron--open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {dropdownOpen && (
                    <div className='dash-nav__dropdown'>
                        <div className='dash-nav__dropdown-info'>
                            <div className='dash-nav__avatar dash-nav__avatar--lg'>{firstLetter}</div>
                            <div>
                                <p className='dash-nav__dropdown-name'>{user?.username || user?.name}</p>
                                <p className='dash-nav__dropdown-email'>{user?.email}</p>
                            </div>
                        </div>
                        <div className='dash-nav__dropdown-divider' />
                        <button className='dash-nav__dropdown-item dash-nav__dropdown-item--signout' onClick={onLogout}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Home = () => {
    const { loading, generateReport, reports, getReports, deleteReport } = useInterview()
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    const [resumes, setResumes] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [formError, setFormError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null) // holds report id to delete
    const resumeInputRef = useRef()

    useEffect(() => {
        getReports()
        getResumes()
            .then(data => setResumes(data?.resumes || data || []))
            .catch(() => setResumes([]))
    }, [])

    const handleGenerate = async () => {
        setFormError('')
        const resumeFile = resumeInputRef.current?.files?.[0]
        if (!jobDescription.trim() || (!resumeFile && !selfDescription.trim())) {
            setFormError('Please provide a job description and either a resume or self description.')
            return
        }
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            const id = data?.interviewReport?._id || data?._id
            if (id) navigate(`/interview/${id}`)
            else setFormError('Unable to generate report. Please try again.')
        } catch (err) {
            setFormError(err.response?.data?.message || 'Unable to generate report. Please try again.')
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    const avgScore = reports?.length
        ? Math.round(reports.reduce((sum, r) => sum + (r.matchScore || 0), 0) / reports.length)
        : 0

    const firstName = user?.username?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'

    return (
        <div className='dash-page'>
            {/* Navbar */}
            <Navbar user={user} onNavigate={navigate} currentPath='/' onLogout={onLogout} />

            <main className='dash-main'>
                {/* Welcome */}
                <section className='dash-welcome'>
                    <h1>Welcome back, <span className='dash-welcome__name'>{firstName}</span></h1>
                    <p>Ready to ace your next interview? Let's get started.</p>
                </section>

                {/* Action Cards */}
                <div className='dash-actions'>
                    <div className='action-card action-card--teal' onClick={() => setShowForm(v => !v)}>
                        <div className='action-card__icon action-card__icon--teal'>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <div className='action-card__body'>
                            <h3>Generate Interview Report</h3>
                            <p>Get AI-powered insights, tailored questions, and a personalized preparation plan for your target role.</p>
                            <span className='action-card__cta action-card__cta--teal'>Start now →</span>
                        </div>
                    </div>

                    <div className='action-card action-card--purple' onClick={() => navigate('/resume-builder')}>
                        <div className='action-card__icon action-card__icon--purple'>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                        <div className='action-card__body'>
                            <h3>Build New Resume</h3>
                            <p>Create a professional, ATS-friendly resume with our AI-powered builder and real-time preview.</p>
                            <span className='action-card__cta action-card__cta--purple'>Create resume →</span>
                        </div>
                    </div>
                </div>

                {/* Inline Generate Form */}
                {showForm && (
                    <div className='gen-form'>
                        <div className='gen-form__panels'>
                            <div className='gen-form__panel'>
                                <label className='gen-form__label'>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                    Target Job Description <span className='gen-form__req'>Required</span>
                                </label>
                                <textarea
                                    className='gen-form__textarea'
                                    placeholder="Paste the full job description here..."
                                    value={jobDescription}
                                    maxLength={5000}
                                    onChange={e => setJobDescription(e.target.value)}
                                />
                                <span className='gen-form__counter'>{jobDescription.length} / 5000</span>
                            </div>
                            <div className='gen-form__panel'>
                                <label className='gen-form__label'>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    Your Profile
                                </label>
                                <label className='gen-form__dropzone' htmlFor='resume-upload'>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                                    <span>Click to upload resume</span>
                                    <small>PDF or DOCX · Max 5MB</small>
                                    <input ref={resumeInputRef} hidden type='file' id='resume-upload' accept='.pdf,.docx' />
                                </label>
                                <div className='gen-form__or'><span>OR</span></div>
                                <textarea
                                    className='gen-form__textarea gen-form__textarea--short'
                                    placeholder="Briefly describe your experience and key skills..."
                                    value={selfDescription}
                                    onChange={e => setSelfDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        {formError && <p className='gen-form__error'>{formError}</p>}
                        <div className='gen-form__footer'>
                            <span className='gen-form__hint'>AI-Powered · ~30 seconds</span>
                            <button className='gen-form__btn' onClick={handleGenerate} disabled={loading}>
                                {loading ? 'Generating...' : '✦ Generate My Interview Strategy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Interview Reports */}
                {reports?.length > 0 && (
                    <section className='dash-section'>
                        <div className='dash-section__header'>
                            <h2>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                Recent Interview Reports
                            </h2>
                            <button className='dash-section__viewall' onClick={() => {}}>View all</button>
                        </div>
                        <div className='report-cards'>
                            {reports.slice(0, 4).map(report => (
                                <div
                                    key={report._id}
                                    className='report-card'
                                    onClick={() => navigate(`/interview/${report._id}`)}
                                >
                                    <div className='report-card__meta'>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                        <span>{report.company || extractCompany(report.title)}</span>
                                        {/* Delete button */}
                                        <button
                                            className='report-card__delete'
                                            title='Delete report'
                                            onClick={e => { e.stopPropagation(); setConfirmDelete(report._id) }}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                        </button>
                                    </div>
                                    <div className='report-card__row'>
                                        <div className='report-card__info'>
                                            <h3>{report.title || 'Untitled Position'}</h3>
                                            <p className='report-card__date'>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <ScoreRing score={report.matchScore} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* My Resumes */}
                {resumes?.length > 0 && (
                    <section className='dash-section'>
                        <div className='dash-section__header'>
                            <h2>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                My Resumes
                            </h2>
                            <button className='dash-section__viewall' onClick={() => navigate('/resume-builder')}>View all</button>
                        </div>
                        <div className='resume-cards'>
                            {resumes.slice(0, 4).map(resume => (
                                <div key={resume._id} className='resume-card' onClick={() => navigate('/resume-builder')}>
                                    <div className='resume-card__icon'>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    </div>
                                    <div className='resume-card__body'>
                                        <h3>{resume.personalInfo?.name || 'Untitled Resume'}</h3>
                                        <p>{resume.personalInfo?.title || resume.title || '—'}</p>
                                        <span className='resume-card__date'>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            Updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Stats Row */}
                <div className='dash-stats'>
                    <div className='stat-card'>
                        <div className='stat-card__icon stat-card__icon--teal'>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <span className='stat-card__value'>{reports?.length || 0}</span>
                        <span className='stat-card__label'>Interview Reports</span>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-card__icon stat-card__icon--purple'>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <span className='stat-card__value'>{resumes?.length || 0}</span>
                        <span className='stat-card__label'>Resumes Created</span>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-card__icon stat-card__icon--green'>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        </div>
                        <span className='stat-card__value'>{avgScore}%</span>
                        <span className='stat-card__label'>Avg Match Score</span>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-card__icon stat-card__icon--pink'>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <span className='stat-card__value'>
                            {resumes.reduce((s, r) => s + (r.enhancementCount || 0), 0) || reports?.length * 3 || 0}
                        </span>
                        <span className='stat-card__label'>AI Enhancements</span>
                    </div>
                </div>
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {confirmDelete && (
                <div className='confirm-overlay' onClick={() => setConfirmDelete(null)}>
                    <div className='confirm-modal' onClick={e => e.stopPropagation()}>
                        <div className='confirm-modal__icon'>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </div>
                        <h3>Delete Report?</h3>
                        <p>This action is permanent and cannot be undone. The report will be removed from your dashboard.</p>
                        <div className='confirm-modal__actions'>
                            <button className='confirm-modal__btn confirm-modal__btn--cancel' onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </button>
                            <button
                                className='confirm-modal__btn confirm-modal__btn--delete'
                                onClick={async () => {
                                    await deleteReport(confirmDelete)
                                    setConfirmDelete(null)
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper: try to extract company name from title string like "Senior Engineer at Google"
function extractCompany(title) {
    if (!title) return ''
    const match = title.match(/\bat\s+([A-Z][^\s,]+)/i)
    return match ? match[1] : ''
}

export default Home