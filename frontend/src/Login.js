import React, {useState} from 'react';
import axios from 'axios';
import { TextField, Button, MenuItem, Card, CardContent, Typography } from '@mui/material';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function Login({onLogin}){
  const [role, setRole] = useState('student'); // Default to student login
  const [email, setEmail] = useState('teacher@example.com');
  const [studentId, setStudentId] = useState('1001');
  const [password, setPassword] = useState('student123'); // Default to student password
  const [err, setErr] = useState('');
  
  // Update password when role changes
  React.useEffect(() => {
    if (role === 'teacher') {
      setPassword('teacher123');
    } else {
      setPassword('student123');
    }
  }, [role]);

  // Student login handler
  const handleStudentLogin = async (e) => {
    if (e) e.preventDefault();
    setErr('');
    
    try {
      console.log('Attempting student login with ID:', studentId);
      
      // Create payload with explicit id field
      const payload = {
        role: 'student',
        id: studentId.trim(),
        password: password
      };
      
      console.log('Student login payload:', payload);
      
      const res = await axios.post(API + '/login', payload);
      if (res.data && res.data.ok) {
        console.log('Student login successful');
        onLogin(res.data.token, res.data.role);
      } else {
        console.log('Student login failed:', res.data.message);
        setErr(res.data.message || 'Login failed');
      }
    } catch (e) {
      console.error('Student login error:', e);
      setErr(e.response?.data?.message || e.message);
    }
  };

  // Teacher login handler
  const handleTeacherLogin = async (e) => {
    if (e) e.preventDefault();
    setErr('');
    
    try {
      const payload = {
        role: 'teacher',
        email: email,
        password: password
      };
      
      console.log('Teacher login payload:', payload);
      
      const res = await axios.post(API + '/login', payload);
      if (res.data && res.data.ok) {
        onLogin(res.data.token, res.data.role);
      } else {
        setErr(res.data.message || 'Login failed');
      }
    } catch (e) {
      console.error('Teacher login error:', e);
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <Card className="auth-card"><CardContent>
      <Typography variant="h5" gutterBottom>Login</Typography>
      
      {role === 'teacher' ? (
        // Teacher Login Form
        <form onSubmit={handleTeacherLogin}>
          <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold', color: '#1976d2'}}>Teacher Login</Typography>
          <TextField 
            label="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            fullWidth 
            margin="normal" 
            type="email"
          />
          <TextField 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            fullWidth 
            margin="normal" 
          />
          <Button 
            variant="contained" 
            type="submit"
            fullWidth
            sx={{mt: 2}}
          >
            Login as Teacher
          </Button>
        </form>
      ) : (
        // Student Login Form
        <form onSubmit={handleStudentLogin}>
          <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold', color: '#1976d2'}}>Student Login</Typography>
          <TextField 
            label="Student ID" 
            value={studentId} 
            onChange={e => setStudentId(e.target.value)} 
            fullWidth 
            margin="normal" 
            type="text"
          />
          <TextField 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            fullWidth 
            margin="normal" 
          />
          <Button 
            variant="contained" 
            type="submit"
            fullWidth
            sx={{mt: 2}}
          >
            Login as Student
          </Button>
        </form>
      )}
      
      <div style={{textAlign: 'center', margin: '20px 0 10px'}}>
        <Button 
          variant="text" 
          onClick={() => setRole(role === 'teacher' ? 'student' : 'teacher')}
        >
          Switch to {role === 'teacher' ? 'Student' : 'Teacher'} Login
        </Button>
      </div>
        
      {err && <Typography color="error" sx={{mt:2, p:1, bgcolor:'#ffebee', borderRadius:1}}>{err}</Typography>}
      
      <Typography variant="caption" display="block" sx={{mt:2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1}}>
        <strong>Teacher Login:</strong> Email: teacher@example.com, Password: teacher123<br/>
        <strong>Student Login:</strong> Enter your Student ID (e.g., 1001) and password "student123"
      </Typography>
      
    </CardContent></Card>
  )
}
