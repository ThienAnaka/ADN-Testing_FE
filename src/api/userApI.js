import axiosInstance from "./axiosInstance";

const userApi = {
  getUserProfileByProfileId: (profileId) =>
    axiosInstance.get(`/user/GetProfile/${profileId}`),
  getUserProfileByUserId: (userId) =>
    axiosInstance.get(`/user/GetProfile/${userId}`),
  submitFormRequest: (data) => axiosInstance.post(`/user/submit`, data),
  registerAccount: (data) =>
    axiosInstance.post(`/user/register`, data),
  login: (data) => axiosInstance.post(`/user/login`, data),
  changePassword: (data) =>
    axiosInstance.put(`/user/change-password`, data),
  sendConsultRequest: (data) =>
    axiosInstance.put(`/user/send-consult-request`, data),
};

export default userApi;
