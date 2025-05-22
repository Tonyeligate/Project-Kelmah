import React, { useState } from 'react';
import { Modal, Button, Form, Switch } from 'antd';

const NotificationSettingsModal = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(settings);
      onCancel();
    }).catch(errorInfo => {
      console.log('Validation Failed:', errorInfo);
    });
  };

  return (
    <Modal
      title="Notification Settings"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Save
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item label="Email Notifications">
          <Switch 
            checked={settings.emailNotifications}
            onChange={(checked) => setSettings(prev => ({...prev, emailNotifications: checked}))}
          />
        </Form.Item>
        <Form.Item label="SMS Notifications">
          <Switch 
            checked={settings.smsNotifications}
            onChange={(checked) => setSettings(prev => ({...prev, smsNotifications: checked}))}
          />
        </Form.Item>
        <Form.Item label="Push Notifications">
          <Switch 
            checked={settings.pushNotifications}
            onChange={(checked) => setSettings(prev => ({...prev, pushNotifications: checked}))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NotificationSettingsModal;
