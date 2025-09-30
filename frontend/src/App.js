import React, {useState} from 'react';
import Login from './Login';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token')||null);
  const [role, setRole] = useState(localStorage.getItem('role')||null);

  const onLogin = (t, r) => { localStorage.setItem('token', t); localStorage.setItem('role', r); setToken(t); setRole(r); }
  const onLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('role'); setToken(null); setRole(null); }

  return (
    <div className="app">
      <header className="header"><h1>Student Performance Prediction</h1></header>
      {!token ? <Login onLogin={onLogin} /> : (role==='teacher' ? <TeacherDashboard token={token} onLogout={onLogout} /> : <StudentDashboard token={token} onLogout={onLogout} />)}
    </div>
  )
}
