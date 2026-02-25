import axios from "axios";

const USER_API = axios.create({
    baseURL: "http://localhost:5000/api/v1/user",
    withCredentials: true,
});

const CHAT_API = axios.create({
    baseURL: "http://localhost:5002/api/v1/chat",
    withCredentials: true,
});

export { USER_API, CHAT_API };
