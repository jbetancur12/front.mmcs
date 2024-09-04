import axios from 'axios'
import { api } from 'src/config'

export const axiosPublic = axios.create({
  baseURL: api()
})

export const axiosPrivate = axios.create({
  baseURL: api()
})

// axiosPrivate.interceptors.request.use((config) => {

//   const token = localStorage.getItem('accessToken')
//   if (token) {
//     config.headers['Authorization'] = `Bearer ${token}`
//   }
//   return config
// })

// axiosPrivate.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async function (error) {
//     const originalRequest = error.config;

//     console.log("Error:",  error.response.status );

//     if (error.response.status === 403 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       console.log("Error:",  error.response.status === 401 && !originalRequest._retry);

//       try {
//         const accessToken = await refreshToken(); // Asegúrate de que refreshToken retorne solo el token

//         if (accessToken) {
//           localStorage.setItem('accessToken', accessToken);
//           axiosPrivate.defaults.headers.common[
//             "Authorization"
//           ] = `Bearer ${accessToken}`;
//           return axiosPrivate(originalRequest);
//         }
//       } catch (refreshError) {
//         console.error("Token refresh failed:", refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );
