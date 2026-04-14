import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
}

const clearToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token")
    }
}

api.interceptors.request.use((config) => {
    const token = getToken()

    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearToken()
        }
        return Promise.reject(error)
    }
)

export const saveResume = async (resumeData) => {
    try {
        const response = await api.post("/api/resume/", resumeData)
        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export const getResumes = async () => {
    try {
        const response = await api.get("/api/resume/")
        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export const getResumeById = async (id) => {
    try {
        const response = await api.get(`/api/resume/${id}`)
        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export const enhanceContent = async ({ field, content, context }) => {
    try {
        const response = await api.post("/api/resume/enhance", { field, content, context })
        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export const downloadResumePdf = async (id, resumeData = null) => {
    try {
        const response = id
            ? await api.get(`/api/resume/${id}/pdf`, { responseType: "blob" })
            : await api.post("/api/resume/pdf", resumeData, { responseType: "blob" });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `resume_${id || 'draft'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        console.error(err)
        throw err
    }
};

export const deleteResume = async (id) => {
    try {
        const response = await api.delete(`/api/resume/${id}`);
        return response.data;
    } catch (err) {
        console.error(err)
        throw err
    }
};
