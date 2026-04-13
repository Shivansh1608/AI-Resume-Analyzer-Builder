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

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password
        })

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }

        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email,
            password
        })

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }

        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        localStorage.removeItem("token")
        return response.data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export async function getMe() {
    try {
        const token = getToken()
        if (!token) {
            return null
        }

        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        console.error(err)
        if (err.response?.status === 401) {
            clearToken()
            return null
        }
        throw err
    }
}
