// src/pages/VnpayCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userApi from "../../api/userApI";

const VnpayCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Đang xử lý...");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const txnStatus = queryParams.get("vnp_TransactionStatus");
    const requestId = queryParams.get("vnp_TxnRef");
    const responseCode = queryParams.get("vnp_ResponseCode");

    if (txnStatus === "00" && responseCode === "00") {
      // 💰 Giao dịch thành công → gọi API tạo đơn ở đây
      const data = {
        requestId,
        // gửi thêm info như userId, sampleMethod, address... nếu bạn lưu tạm vào localStorage/session trước đó
      };

      // Gọi API tạo đơn (hoặc xác nhận trạng thái)
      userApi.submitFormRequest(data)
        .then(() => {
          setStatus("✅ Thanh toán thành công! Đơn đã được ghi nhận.");
        })
        .catch(() => {
          setStatus("⚠️ Thanh toán thành công, nhưng không thể tạo đơn.");
        });
    } else {
      setStatus("❌ Thanh toán thất bại hoặc bị hủy.");
    }
  }, []);

  return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <h2>{status}</h2>
      <button onClick={() => navigate("/")}>Quay lại trang chủ</button>
    </div>
  );
};

export default VnpayCallback;
