import axios from "axios";
import { baseApiURL } from "../baseUrl";
const axiosWrapper = axios.create({
  baseURL: baseApiURL(),
  withCredentials: true,
});

axiosWrapper.interceptors.request.use((config) => {
  if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  config.withCredentials = true;
  return config;
});

axiosWrapper.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosWrapper;
