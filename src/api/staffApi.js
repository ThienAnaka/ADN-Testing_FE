import axiosInstance from "./axiosInstance";

const staffApi = {
  getRequestHome: () => axiosInstance.get(`/staff/at-home`),
  getRequestPending: () => axiosInstance.get(`/staff/pending`),
  getConsultRequest: () => axiosInstance.get(`/staff/pending-consults`),
  handleConsultRequest: (data) =>
    axiosInstance.put("/staff/consults/complete", data),
  assignRequest: (data) =>
    axiosInstance.post("/staff/assign-test-process", data),
  getTestProccesses: () => axiosInstance.get("/staff/test-processes"),
  getRequestCenter: () => axiosInstance.get("/staff/at-center"),
  getSamplesByRequestId: (requestId) =>
    axiosInstance.get(`/staff/samples?requestId=${requestId}`),
  getFeedbacks: () => axiosInstance.get(`/staff/get-staff-feedback`),
  updateRequest: (requestId, data) => axiosInstance.put(`/staff/update-status/${requestId}`, data),
  sendKit:  (data) => axiosInstance.put(`/staff/update-test-process`, data),
  receiveSample: (data) => axiosInstance.put(`/staff/mark-sample-received`, data),
  updateHomeSampleVoluntary: (data) => axiosInstance.put(`/staff/update-by-request`, data),
  createSampleAdministration: (data) => axiosInstance.post(`/staff/post-SampleCollection`, data),
  createTestResult: (data) => axiosInstance.post(`staff/test-results/create`,data)
};

export default staffApi;
