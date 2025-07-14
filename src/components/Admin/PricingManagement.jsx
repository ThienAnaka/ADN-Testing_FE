import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Switch,
} from "antd";

import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import "../../Css/PricingManagement.css";
import adminApi from "../../api/adminApi";

const { TabPane } = Tabs;

const PricingManagement = () => {
  const [activeTab, setActiveTab] = useState("Voluntary");
  const [editingService, setEditingService] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [categorizedServices, setCategorizedServices] = useState({
    Voluntary: [],
    Administrative: [],
  });

  const fetchServices = async () => {
    try {
      const response = await adminApi.getAllService();
      if (response) {
        const voluntary = response.data.filter(
          (s) => s.category === "Voluntary"
        );
        const administrative = response.data.filter(
          (s) => s.category === "Administrative"
        );
        setCategorizedServices({
          Voluntary: voluntary,
          Administrative: administrative,
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      message.error("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (record) => {
    setEditingService(record);
    form.setFieldsValue({
      id: record.id,
      serviceName: record.serviceName,
      price3Samples: record.price3Samples,
      price2Samples: record.price2Samples,
      timeToResult: record.timeToResult,
      description: record.description,
      slug: record.slug,
      numberSample: record.numberSample,
      category: record.category,
      isUrgent: record.isUrgent,
      isPublished: record.isPublished,
      includeVAT: record.includeVAT,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa dịch vụ này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await adminApi.deleteServiceById(id);
          message.success("Xóa dịch vụ thành công!");
          fetchServices();
        } catch (error) {
          console.error("Lỗi khi xóa dịch vụ:", error);
          message.error("Không thể xóa dịch vụ. Vui lòng thử lại sau.");
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const response = await adminApi.updateService({
        serviceID: editingService.id,
        serviceName: values.serviceName,
        description: values.description || "",
        slug: values.slug || "",
        category: values.category,
        numberSample: editingService.numberSample, // 👈 giữ nguyên
        isUrgent: editingService.isUrgent, // 👈 giữ nguyên
        isPublished: editingService.isPublished, // 👈 giữ nguyên
        price2Samples: values.price2Samples ?? 0,
        price3Samples: values.price3Samples,
        timeToResult: values.timeToResult,
        includeVAT: values.includeVAT ?? true,
      });
      if (response.status != 200) {
        throw new Error("Cập nhật dịch vụ không thành công");
      }
      message.success("Cập nhật thành công!");
      setIsModalVisible(false);
      fetchServices();
      alert("Cập nhật dịch vụ thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      message.error("Không thể cập nhật dịch vụ. Vui lòng thử lại sau.");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const columns = [
    {
      title: "Tên dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      width: "30%",
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price2Samples",
      key: "price2Samples",
      render: (text) => formatCurrency(text),
    },
    {
      title: "Giá người thứ 3 (VNĐ)",
      dataIndex: "price3Samples",
      key: "price3Samples",
      render: (text) => formatCurrency(text),
    },

    {
      title: "Thời gian",
      dataIndex: "timeToResult",
      key: "timeToResult",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="edit-button"
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Sửa
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>
        Quản lý thời gian & chi phí
      </h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Xét nghiệm ADN dân sự" key="Voluntary">
          <Table
            columns={columns}
            dataSource={categorizedServices.Voluntary}
            rowKey="id"
            pagination={false}
          />
        </TabPane>
        <TabPane tab="Xét nghiệm ADN hành chính" key="Administrative">
          <Table
            columns={columns}
            dataSource={categorizedServices.Administrative}
            rowKey="id"
            pagination={false}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="Chỉnh sửa dịch vụ"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            className="save-button"
          >
            Lưu thay đổi
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="serviceName"
            label="Tên dịch vụ"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả dịch vụ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Vui lòng nhập slug" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="Loại"
            rules={[{ required: true, message: "Vui lòng chọn loại dịch vụ!" }]}
          >
            <Select placeholder="Chọn loại">
              <Select.Option value="Voluntary">
                Xét nghiệm ADN dân sự
              </Select.Option>
              <Select.Option value="Administrative">
                Xét nghiệm ADN hành chính
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="price2Samples"
            label="Giá (VNĐ)"
            rules={[
              { required: true, message: "Vui lòng nhập giá 2 mẫu" },
              {
                type: "number",
                min: 0,
                message: "Giá phải là số không âm",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={100000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => parseInt(value.replace(/,/g, ""))}
            />
          </Form.Item>

          <Form.Item
            name="price3Samples"
            label="Giá người thứ 3 (VNĐ)"
            rules={[
              { required: true, message: "Vui lòng nhập giá người thứ 3" },
              {
                type: "number",
                min: 0,
                message: "Giá phải là số không âm",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={100000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => parseInt(value.replace(/,/g, ""))}
            />
          </Form.Item>

          <Form.Item
            name="timeToResult"
            label="Thời gian trả kết quả"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập thời gian trả kết quả",
              },
            ]}
          >
            <Input placeholder="Ví dụ: 3-5 ngày" />
          </Form.Item>

          <Form.Item
            name="includeVAT"
            label="Đã bao gồm VAT"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PricingManagement;
