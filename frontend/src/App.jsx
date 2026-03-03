import React, { useState, useRef, useEffect } from 'react';
import { Layout, List, Input, Button, Typography, Space, Spin, Avatar } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是 VentureAgent，你的创新创业智能体助理。我们可以讨论你的创业想法。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('网络请求异常 (状态码: ' + response.status + ')');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('获取响应时出错:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: `[请求出错] 无法连接到后端服务器，请检查后端是否运行在 localhost:8000。详细信息: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Title level={3} style={{ color: 'white', margin: '16px 0' }}>VentureAgent MVP</Title>
      </Header>

      <Content className="content">
        <div className="chat-container">
          <List
            className="message-list"
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(item) => (
              <List.Item className={`message-item ${item.role}`}>
                <div className={`message-bubble ${item.role}`}>
                  <div className="message-avatar">
                    {item.role === 'user' ? <Avatar icon={<UserOutlined />} /> : <Avatar style={{ backgroundColor: '#1890ff' }} icon={<RobotOutlined />} />}
                  </div>
                  <div className="message-content">
                    {item.content}
                  </div>
                </div>
              </List.Item>
            )}
          />
          {loading && (
            <div className="loading-container">
              <Spin tip="Agent 正在思考中..." />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Content>

      <Footer className="footer">
        <Space.Compact style={{ width: '100%', maxWidth: '800px' }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题或创业想法 (例如: 什么是精益创业？ 或 我想做一个校园外卖的项目)... 按 Enter 发送"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            onClick={handleSend}
            loading={loading}
            icon={<SendOutlined />}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </Space.Compact>
      </Footer>
    </Layout>
  );
}

export default App;
