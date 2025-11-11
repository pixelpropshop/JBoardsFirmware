import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jboardService } from '../services/jboardService';
import type { JBoardDevice, JBoardMessage, ThisDevice } from '../types/jboard';
import { DeviceType, DeviceCapability } from '../types/jboard';

export default function JBoardDeviceDetails() {
  const { mac } = useParams<{ mac: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<JBoardDevice | null>(null);
  const [thisDevice, setThisDevice] = useState<ThisDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [command, setCommand] = useState('');
  const [commandData, setCommandData] = useState('{}');
  const [messages, setMessages] = useState<JBoardMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDevice();
    loadThisDevice();
    loadMessages();
    
    // Auto-refresh messages every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [mac]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadDevice = async () => {
    setLoading(true);
    try {
      const peers = await jboardService.getPeers();
      const found = peers.find(p => p.mac === mac);
      if (found) {
        setDevice(found);
      } else {
        setMessage({ type: 'error', text: 'Device not found' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load device' });
    } finally {
      setLoading(false);
    }
  };

  const loadThisDevice = async () => {
    try {
      const device = await jboardService.getThisDevice();
      setThisDevice(device);
    } catch (error) {
      console.error('Failed to load this device:', error);
    }
  };

  const loadMessages = async () => {
    if (!mac || !thisDevice) return;
    
    try {
      const allMessages = await jboardService.getMessages(100);
      // Filter messages between this device and the selected device
      const filtered = allMessages.filter(msg => 
        (msg.from === thisDevice.mac && msg.to === mac) ||
        (msg.from === mac && msg.to === thisDevice.mac)
      );
      setMessages(filtered);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendCommand = async () => {
    if (!device || !command.trim()) return;

    setSending(true);
    setMessage(null);
    try {
      let data = {};
      if (commandData.trim()) {
        data = JSON.parse(commandData);
      }

      const result = await jboardService.sendMessage(device.mac, command, data);
      if (result.success) {
        setMessage({ type: 'success', text: 'Command sent successfully' });
        setCommand('');
        setCommandData('{}');
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send command' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid JSON or send failed' });
    } finally {
      setSending(false);
    }
  };

  const getDeviceTypeName = (type: DeviceType): string => {
    switch (type) {
      case DeviceType.JSENSE_BOARD: return 'JSense Board';
      case DeviceType.LED_CONTROLLER: return 'LED Controller';
      case DeviceType.SENSOR_HUB: return 'Sensor Hub';
      case DeviceType.AUDIO_REACTIVE: return 'Audio Reactive';
      case DeviceType.EFFECTS_CONTROLLER: return 'Effects Controller';
      default: return 'Unknown Device';
    }
  };

  const hasCapability = (capability: DeviceCapability): boolean => {
    return device ? (device.capabilities & capability) !== 0 : false;
  };

  const handleSendChat = async () => {
    if (!device || !chatMessage.trim() || !thisDevice) return;

    setSendingChat(true);
    try {
      const result = await jboardService.sendMessage(device.mac, 'CHAT_MESSAGE', { 
        text: chatMessage.trim() 
      });
      
      if (result.success) {
        setChatMessage('');
        await loadMessages(); // Refresh messages
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send message' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send message' });
    } finally {
      setSendingChat(false);
    }
  };

  const getTimeSince = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDisplay = (msg: JBoardMessage): string => {
    if (msg.type === 'CHAT_MESSAGE' && msg.payload?.text) {
      return msg.payload.text;
    }
    // Show command type for non-chat messages
    return `[${msg.type}]`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading device details...</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Device not found</p>
        <button
          onClick={() => navigate('/jboard-network')}
          className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
        >
          Back to JBoard Network
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/jboard-network')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold">{device.name}</h1>
          <p className="text-sm text-gray-500">{getDeviceTypeName(device.type)}</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Device Info */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-3">Device Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">IP Address:</span>
              <span className="font-mono">{device.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Firmware:</span>
              <span className="font-mono">{device.firmwareVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Signal:</span>
              <span>{device.rssi} dBm ({device.rssi > -50 ? 'Excellent' : device.rssi > -70 ? 'Good' : 'Weak'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Seen:</span>
              <span>{getTimeSince(device.lastSeen)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-3">Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {hasCapability(DeviceCapability.LED_CONTROL) && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                LED Control
              </span>
            )}
            {hasCapability(DeviceCapability.SENSOR_DATA) && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                Sensors
              </span>
            )}
            {hasCapability(DeviceCapability.AUDIO_PLAYBACK) && (
              <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                Audio
              </span>
            )}
            {hasCapability(DeviceCapability.WEB_INTERFACE) && (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                Web Interface
              </span>
            )}
            {hasCapability(DeviceCapability.BATTERY_POWERED) && (
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                Battery Powered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Send Command */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
        <h2 className="text-lg font-medium mb-3">Send Command</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Command
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., set_brightness, set_color, reboot"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Data (JSON)
            </label>
            <textarea
              value={commandData}
              onChange={(e) => setCommandData(e.target.value)}
              placeholder='{"value": 75}'
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter command parameters as JSON
            </p>
          </div>

          <button
            onClick={handleSendCommand}
            disabled={sending || !command.trim()}
            className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Command'}
          </button>
        </div>

        {/* Quick Commands */}
        {hasCapability(DeviceCapability.LED_CONTROL) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Quick Commands</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setCommand('set_brightness');
                  setCommandData('{"value": 100}');
                }}
                className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Max Brightness
              </button>
              <button
                onClick={() => {
                  setCommand('set_brightness');
                  setCommandData('{"value": 0}');
                }}
                className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Lights Off
              </button>
              <button
                onClick={() => {
                  setCommand('set_color');
                  setCommandData('{"r": 255, "g": 0, "b": 0}');
                }}
                className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Red
              </button>
              <button
                onClick={() => {
                  setCommand('reboot');
                  setCommandData('{}');
                }}
                className="text-xs px-3 py-1 rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Reboot Device
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message History / Chat */}
      <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 overflow-hidden flex flex-col" style={{ height: '500px' }}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium">Message History</h2>
          <p className="text-sm text-gray-500">Chat and command history with this device</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Send a message to start chatting.
            </div>
          ) : (
            messages.map((msg) => {
              const isSent = thisDevice && msg.from === thisDevice.mac;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isSent
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="text-sm break-words">
                      {getMessageDisplay(msg)}
                    </div>
                    <div
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isSent ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      {isSent && (
                        <span>
                          {msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
              disabled={sendingChat}
            />
            <button
              onClick={handleSendChat}
              disabled={sendingChat || !chatMessage.trim()}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
            >
              {sendingChat ? (
                'Sending...'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
