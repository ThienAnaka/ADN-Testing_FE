"use client";

import { useState, useEffect, useContext } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Modal,
  Table,
  Tag,
  message,
  Upload,
  Tabs,
} from "antd";
import dayjs from "dayjs";

import {
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CameraOutlined,
  SaveOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import staffApi from "../../api/staffApi";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SampleCollection = ({ caseType }) => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [sampleForms, setSampleForms] = useState([]);
  const [donors, setDonors] = useState([
    {
      id: 1,
      name: "",
      idType: "CCCD",
      idNumber: "",
      idIssueDate: null,
      idIssuePlace: "",
      nationality: "Việt Nam",
      address: "",
      sampleType: "Máu",
      sampleQuantity: "01",
      relationship: "",
      healthIssues: "không",
      fingerprint: null,
    },
  ]);
  const { user } = useContext(AuthContext);
  console.log(user);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const title =
    caseType === "Dân sự"
      ? "Lấy mẫu xét nghiệm dân sự"
      : "Lấy mẫu xét nghiệm hành chính";

  // Danh sách loại xét nghiệm hành chính
  const adminTestTypes = [
    "Xét nghiệm ADN hành chính - Khai sinh",
    "Xét nghiệm ADN hành chính - Di trú",
    "Xét nghiệm ADN hành chính - Thừa kế",
    "Xét nghiệm ADN hành chính - Tranh chấp",
    "Xét nghiệm ADN hành chính - Nhanh",
  ];

  useEffect(() => {
    const savedForms = JSON.parse(
      localStorage.getItem("sample_collection_forms") || "[]"
    );
    setSampleForms(savedForms);
  }, []);

  useEffect(() => {
    console.log("location.search:", location.search); // Debug URL parameters
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    const requesterName = params.get("requesterName");
    if (orderId) {
      form.setFieldsValue({ orderId: orderId.toString() });
    }
    if (requesterName) {
      form.setFieldsValue({ requesterName });
    }
  }, [location.search, form]);

  useEffect(() => {
    const prefillRaw = localStorage.getItem("dna_sample_collection_prefill");

    if (prefillRaw) {
      const prefillData = JSON.parse(prefillRaw);

      // Dùng dayjs để parse ngày
      const collectionDate = prefillData.collectionDate
        ? dayjs(prefillData.collectionDate)
        : null;

      console.log("Parsed date:", collectionDate); // Kiểm tra có phải dayjs object không

      form.setFieldsValue({
        collectionDate: "",
        location: prefillData.address || "",
        collector: user?.name || "",
        orderId: prefillData.orderId ? `#${prefillData.orderId}` : "",
        testType: prefillData.serviceType || "",
        requesterName: prefillData.fullName || "",
        requesterAddress: prefillData.address || "",
      });
    }
  }, []);

  // Auto-save form draft mỗi khi form thay đổi
  const handleAutoSave = (changedValues, allValues) => {
    localStorage.setItem(
      "sample_collection_draft",
      JSON.stringify({
        form: allValues,
        donors: donors,
      })
    );
  };

  // Auto-save khi donors thay đổi
  useEffect(() => {
    const values = form.getFieldsValue();
    localStorage.setItem(
      "sample_collection_draft",
      JSON.stringify({
        form: values,
        donors: donors,
      })
    );
  }, [donors]);

  // Khi mở tab, nếu có draft thì tự động điền lại
  useEffect(() => {
    const draft = localStorage.getItem("sample_collection_draft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        console.log("Draft data:", data); // Debug draft data
        if (data.form) {
          form.setFieldsValue(data.form);
        }
        if (data.donors) {
          setDonors(data.donors);
        }
      } catch (error) {
        console.error("Error parsing draft:", error);
        localStorage.removeItem("sample_collection_draft");
      }
    }
  }, [form]);

  const addDonor = () => {
    const newDonor = {
      id: donors.length + 1,
      name: "",
      idType: "CCCD",
      idNumber: "",
      idIssueDate: null,
      idIssuePlace: "",
      nationality: "Việt Nam",
      address: "",
      sampleType: "Máu",
      sampleQuantity: "01",
      relationship: "",
      healthIssues: "không",
      fingerprint: null,
    };
    const newDonors = [...donors, newDonor];
    setDonors(newDonors);
    const values = form.getFieldsValue();
    localStorage.setItem(
      "sample_collection_draft",
      JSON.stringify({ form: values, donors: newDonors })
    );
  };

  const removeDonor = (id) => {
    if (donors.length > 1) {
      const newDonors = donors.filter((donor) => donor.id !== id);
      setDonors(newDonors);
      const values = form.getFieldsValue();
      localStorage.setItem(
        "sample_collection_draft",
        JSON.stringify({ form: values, donors: newDonors })
      );
    }
  };

  const updateDonor = (id, field, value) => {
    const newDonors = donors.map((donor) =>
      donor.id === id ? { ...donor, [field]: value } : donor
    );
    setDonors(newDonors);
    const values = form.getFieldsValue();
    localStorage.setItem(
      "sample_collection_draft",
      JSON.stringify({ form: values, donors: newDonors })
    );
  };

  const handleSaveAndSubmit = async () => {
    try {
      await form.validateFields(); // Kiểm tra validation
      const formData = form.getFieldsValue();
      const processId = selectedOrder?.orderProcessId;

      if (!processId) {
        message.error("Không tìm thấy Process ID cho đơn hàng.");
        return;
      }

      const payload = {
        collectionId: user.userid,
        processId: processId,
        location: formData.location,
        sampleProviders: donors.map((donor) => ({
          fullName: donor.name,
          yob: parseInt(donor.birth) || null,
          gender: donor.gender,
          idType: donor.idType,
          idNumber: donor.idNumber,
          idIssuedDate:
            donor.idIssueDate && dayjs.isDayjs(donor.idIssueDate)
              ? donor.idIssueDate.format("YYYY-MM-DD")
              : null,
          idIssuedPlace: donor.idIssuePlace,
          address: donor.address,
          sampleType: donor.sampleType,
          quantity: donor.sampleQuantity || "01",
          relationship: donor.relationship,
          hasGeneticDiseaseHistory:
            donor.healthIssues && donor.healthIssues !== "không",
          fingerprintImage: donor.fingerprint || "",
          confirmedBy: user?.name || "",
          note: "",
        })),
      };

      console.log("Payload:", JSON.stringify(payload, null, 2)); // Debug payload

      const res = await staffApi.createSampleAdministration(payload);
      console.log("API response:", res); // Debug API response
      message.success("Lưu và gửi biên bản thành công!");

      form.resetFields();
      setDonors([
        {
          id: 1,
          name: "",
          idType: "CCCD",
          idNumber: "",
          idIssueDate: null,
          idIssuePlace: "",
          nationality: "Việt Nam",
          address: "",
          sampleType: "Máu",
          sampleQuantity: "01",
          relationship: "",
          healthIssues: "không",
          fingerprint: null,
        },
      ]);
      localStorage.removeItem("sample_collection_draft");
      setShowSuccessOverlay(true);
      setTimeout(() => setShowSuccessOverlay(false), 3000);
    } catch (error) {
      console.error(
        "Error submitting sample collection:",
        error.response?.data || error.message
      );
      message.error(
        `Lỗi khi gửi biên bản: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSave = async (values) => {
    try {
      const newForm = {
        id: Date.now(),
        ...values,
        collectionDate: values.collectionDate.format("DD/MM/YYYY"),
        donors: donors,
        createdAt: new Date().toLocaleString("vi-VN"),
        status: "Đã lấy mẫu",
      };

      const updatedForms = [...sampleForms, newForm];
      setSampleForms(updatedForms);
      localStorage.setItem(
        "sample_collection_forms",
        JSON.stringify(updatedForms)
      );

      const orders = JSON.parse(localStorage.getItem("dna_orders") || "[]");
      const resultTableData = donors.map((donor, idx) => ({
        key: idx + 1,
        name: donor.name,
        birthYear: donor.birth,
        gender: donor.gender,
        relationship: donor.relationship || "",
        sampleType: donor.sampleType,
      }));
      const updatedOrders = orders.map((order) => {
        if (
          order.id.toString() === values.orderId &&
          order.type.includes("hành chính")
        ) {
          return {
            ...order,
            sampleCollected: true,
            sampleCollectionId: newForm.id,
            status: "Đang xử lý",
            sampleInfo: {
              location: values.location,
              collector: values.collector,
              collectionDate: values.collectionDate.format("DD/MM/YYYY"),
              donors: donors,
            },
            resultTableData: resultTableData,
          };
        }
        return order;
      });
      localStorage.setItem("dna_orders", JSON.stringify(updatedOrders));

      setShowSuccessOverlay(true);
      setTimeout(() => {
        setShowSuccessOverlay(false);
        form.resetFields();
        setDonors([
          {
            id: 1,
            name: "",
            idType: "CCCD",
            idNumber: "",
            idIssueDate: null,
            idIssuePlace: "",
            nationality: "Việt Nam",
            sampleType: "Máu",
            relationship: "",
          },
        ]);
        localStorage.removeItem("sample_collection_draft");
      }, 3000);
    } catch {
      message.error("Có lỗi xảy ra khi lưu biên bản!");
    }
  };

  const disabledDate = (current) => {
    const today = dayjs().startOf("day");
    if (!current) return false;
    return current < today || current.day() === 0;
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 28, fontWeight: 700, color: "#00a67e", margin: 0 }}
        >
          {title}
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0", fontSize: 16 }}>
          Tạo biên bản lấy mẫu cho xét nghiệm ADN{" "}
          {caseType === "Dân sự" ? "dân sự" : "hành chính"}
        </p>
      </div>

      <Tabs defaultActiveKey="create">
        <TabPane tab="Tạo biên bản mới" key="create">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveAndSubmit}
              onValuesChange={handleAutoSave}
            >
              <Title
                level={4}
                style={{ textAlign: "center", color: "#00a67e" }}
              >
                BIÊN BẢN LẤY MẪU XÉT NGHIỆM
              </Title>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="collectionDate"
                    label="Ngày lấy mẫu"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày lấy mẫu!",
                      },
                    ]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      disabledDate={disabledDate}
                      disabled={
                        !!selectedOrder && !!selectedOrder.appointmentDate
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="location"
                    label="Địa điểm lấy mẫu"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa điểm!" },
                    ]}
                  >
                    <Input placeholder="Ví dụ: 132 Hoàng Văn Thụ, phường Phương Sài, Nha Trang" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="collector"
                    label="Nhân viên thu mẫu"
                    rules={[
                      { required: true, message: "Vui lòng chọn nhân viên!" },
                    ]}
                  >
                    <Input
                      value={user?.fullName || ""}
                      
                      style={{ fontWeight: 700, color: "#00a67e" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="orderId"
                    label="Mã đơn hàng"
                    rules={[
                      { required: true, message: "Vui lòng chọn đơn hàng!" },
                    ]}
                  >
                    <Input
                      value={
                        selectedOrder
                          ? `#${selectedOrder.id}`
                          : "Chưa chọn đơn hàng"
                      }
                      disabled
                      style={{ fontWeight: 700, color: "#0984e3" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {selectedOrder && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="testType"
                      label="Loại xét nghiệm"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn loại xét nghiệm!",
                        },
                      ]}
                    >
                      <Select
                        value={form.getFieldValue("testType")}
                        onChange={(value) =>
                          form.setFieldsValue({ testType: value })
                        }
                      >
                        {adminTestTypes.map((type) => (
                          <Option key={type} value={type}>
                            {type}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="requesterName"
                    label="Người yêu cầu xét nghiệm"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên người yêu cầu!",
                      },
                    ]}
                  >
                    <Input
                      value={
                        selectedOrder
                          ? `${selectedOrder.name}`
                          : "Chưa chọn đơn hàng"
                      }
                      disabled
                      style={{ fontWeight: 700, color: "#0984e3" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="requesterAddress"
                    label="Địa chỉ hiện tại"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ!" },
                    ]}
                  >
                    <Input placeholder="Địa chỉ hiện tại của người yêu cầu" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Thông tin người cho mẫu</Divider>

              {donors.map((donor, index) => (
                <Card
                  key={donor.id}
                  size="small"
                  title={`Người cho mẫu thứ ${index + 1}`}
                  extra={
                    donors.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeDonor(donor.id)}
                        style={{
                          color: "#ff4d4f",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.fontWeight = "600";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.fontWeight = "500";
                        }}
                      />
                    )
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Họ và tên" required>
                        <Input
                          value={donor.name}
                          onChange={(e) =>
                            updateDonor(donor.id, "name", e.target.value)
                          }
                          placeholder="Họ và tên đầy đủ"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Giới tính" required>
                        <Select
                          value={donor.gender}
                          onChange={(value) =>
                            updateDonor(donor.id, "gender", value)
                          }
                        >
                          <Option value="Nam">Nam</Option>
                          <Option value="Nữ">Nữ</Option>
                          <Option value="Khác">Khác</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Năm sinh" required>
                        <Input
                          value={donor.birth}
                          onChange={(e) =>
                            updateDonor(donor.id, "birth", e.target.value)
                          }
                          placeholder="Năm sinh"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Loại giấy tờ" required>
                        <Select
                          value={
                            ["CCCD", "Giấy Chứng Sinh", "Bằng Lái Xe"].includes(
                              donor.idType
                            )
                              ? donor.idType
                              : "CCCD"
                          }
                          onChange={(value) =>
                            updateDonor(donor.id, "idType", value)
                          }
                        >
                          <Option value="CCCD">CCCD</Option>
                          <Option value="Giấy Chứng Sinh">
                            Giấy Chứng Sinh
                          </Option>
                          <Option value="Bằng Lái Xe">Bằng Lái Xe</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Quốc tịch">
                        <Input
                          value={donor.nationality}
                          onChange={(e) =>
                            updateDonor(donor.id, "nationality", e.target.value)
                          }
                          placeholder="Quốc tịch"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Ngày cấp">
                        <DatePicker
                          value={donor.idIssueDate}
                          onChange={(date) =>
                            updateDonor(donor.id, "idIssueDate", date)
                          }
                          format="DD/MM/YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Nơi cấp">
                        <Input
                          value={donor.idIssuePlace}
                          onChange={(e) =>
                            updateDonor(
                              donor.id,
                              "idIssuePlace",
                              e.target.value
                            )
                          }
                          placeholder="Nơi cấp giấy tờ"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Loại mẫu" required>
                        <Select
                          value={donor.sampleType}
                          onChange={(value) =>
                            updateDonor(donor.id, "sampleType", value)
                          }
                        >
                          <Option value="Nước bọt">Nước bọt</Option>
                          <Option value="Máu">Máu</Option>
                          <Option value="Tóc">Tóc</Option>
                          <Option value="Móng">Móng</Option>
                          <Option value="Niêm mạc">Niêm mạc</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Mối quan hệ" required>
                        <Input
                          value={donor.relationship}
                          onChange={(e) =>
                            updateDonor(
                              donor.id,
                              "relationship",
                              e.target.value
                            )
                          }
                          placeholder="Ví dụ: Bố, Mẹ, Con..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={addDonor}
                icon={<PlusOutlined />}
                style={{
                  width: "100%",
                  marginBottom: 24,
                  borderColor: "#00a67e",
                  color: "#00a67e",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#008f6b";
                  e.target.style.color = "#008f6b";
                  e.target.style.fontWeight = "600";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#00a67e";
                  e.target.style.color = "#00a67e";
                  e.target.style.fontWeight = "500";
                }}
              >
                Thêm người cho mẫu
              </Button>

              <div style={{ textAlign: "center" }}>
                <Space size="large">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    style={{
                      backgroundColor: "#00a67e",
                      borderColor: "#00a67e",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#008f6b";
                      e.target.style.borderColor = "#008f6b";
                      e.target.style.fontWeight = "600";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#00a67e";
                      e.target.style.borderColor = "#00a67e";
                      e.target.style.fontWeight = "500";
                    }}
                  >
                    Xác nhận lấy mẫu
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Xem biên bản lấy mẫu"
        open={false}
        onCancel={() => {}}
        footer={[
          <Button
            key="close"
            onClick={() => {}}
            style={{
              backgroundColor: "#00a67e",
              borderColor: "#00a67e",
              color: "white",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#008f6b";
              e.target.style.borderColor = "#008f6b";
              e.target.style.fontWeight = "600";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#00a67e";
              e.target.style.borderColor = "#00a67e";
              e.target.style.fontWeight = "500";
            }}
          >
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{
              backgroundColor: "#00a67e",
              borderColor: "#00a67e",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#008f6b";
              e.target.style.borderColor = "#008f6b";
              e.target.style.fontWeight = "600";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#00a67e";
              e.target.style.borderColor = "#00a67e";
              e.target.style.fontWeight = "500";
            }}
          >
            In biên bản
          </Button>,
        ]}
        width={800}
      >
        {/* Content of the modal */}
      </Modal>

      {showSuccessOverlay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.97)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            boxShadow: "0 8px 32px #0002",
            animation: "fadeIn 0.3s",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #e0f7fa 0%, #e6ffe6 100%)",
              border: "2.5px solid #00b894",
              borderRadius: 20,
              padding: "48px 40px",
              boxShadow: "0 4px 32px #00b89422",
              textAlign: "center",
              maxWidth: 480,
              minWidth: 320,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 18, lineHeight: 1 }}>
              🧬
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: "#009e74",
                marginBottom: 14,
                letterSpacing: 0.5,
              }}
            >
              Lấy mẫu thành công!
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#222",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              Biên bản đã được lưu và đơn hàng chuyển sang trạng thái Đang xử
              lý.
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#555",
                marginTop: 18,
                lineHeight: 1.6,
              }}
            >
              Bạn có thể tiếp tục nhập đơn mới hoặc quay lại danh sách.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleCollection;
