import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import api from '../services/api.js';

function Assistant() {
  const [question, setQuestion] = useState('');
  const [course, setCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
 const [sidebarOpen, setSidebarOpen] = useState(false);

  const askQuestion = async (customQuestion) => {
    const questionToAsk = customQuestion || question;

    if (!questionToAsk || !course) {
      setError('Please enter both a course and a question.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/schedules/assistant/ask', {
        question: questionToAsk,
        course,
      });

      const newMessage = {
        question: questionToAsk,
        answer: response.data.data.answer,
      };

      setMessages([...messages, newMessage]);
      setQuestion('');
    } catch (err) {
      setError('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const presetButtons = [
    { label: '📝 Simplify', prompt: 'Simplify this topic in simple terms: ' },
    { label: '📋 Summarise', prompt: 'Give me a brief summary of: ' },
    { label: '🔑 Key Points', prompt: 'List the most important key points of: ' },
    { label: '❓ Quiz Me', prompt: 'Generate 5 quiz questions about: ' },
    { label: '🔰 Explain', prompt: 'Explain this like I am a beginner: ' },
  ];

  return (
    <>
     
    <Navigationbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
     

      <div style={{ marginTop: '60px', padding: '20px' }}>
        <h1>Study Assistant</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <label>Course</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Biology"
          />
        </div>

        <div>
          <label>Ask a question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is photosynthesis?"
          />
          <button onClick={() => askQuestion()} disabled={loading}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>

        <div>
          {presetButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => askQuestion(`${btn.prompt}${question || course}`)}
              disabled={loading}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div>
          {messages.map((msg, index) => (
            <div key={index} style={{ border: '1px solid gray', margin: '10px', padding: '10px' }}>
              <p><strong>You:</strong> {msg.question}</p>
              <p><strong>Gemini:</strong></p>
              <ReactMarkdown>{msg.answer}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Assistant;