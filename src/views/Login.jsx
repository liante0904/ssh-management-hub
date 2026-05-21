import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';

export default function Login({ onLogin }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(secret);
      setToken(res.access_token);
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={submit}>
        <h1>SSH Management Hub</h1>
        <p>관리자 인증이 필요합니다</p>
        <input type="password" placeholder="JWT Secret Key" value={secret}
          onChange={(e) => setSecret(e.target.value)} autoFocus />
        <button className="primary" type="submit" disabled={loading || !secret}>
          {loading ? '...' : 'Login'}
        </button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
}
