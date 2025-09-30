import React, {useState} from 'react';
import axios from 'axios';
import { TextField, Button, MenuItem, Card, CardContent, Typography } from '@mui/material';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function Login({onLogin}){
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('teacher@example.com');
  const [id, setId] = useState('1001');
  const [password, setPassword] = useState('teacher123');
  const [err, setErr] = useState('');

  const submit = async (e) =>{
    e.preventDefault(); setErr('');
    try{
      const payload = role==='teacher' ? {role, email, password} : {role, id, password};
      const res = await axios.post(API + '/login', payload);
      if(res.data && res.data.ok){ onLogin(res.data.token, res.data.role); }
      else setErr(res.data.message || 'Login failed');
    }catch(e){ setErr(e.response?.data?.message || e.message); }
  };

  return (
    <Card className="auth-card"><CardContent>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <form onSubmit={submit}>
        <TextField select value={role} label="Role" onChange={e=>setRole(e.target.value)} fullWidth margin="normal">
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="teacher">Teacher</MenuItem>
        </TextField>
        {role==='teacher' ? <TextField label="Teacher Email" value={email} onChange={e=>setEmail(e.target.value)} fullWidth margin="normal" /> : <TextField label="Student ID" value={id} onChange={e=>setId(e.target.value)} fullWidth margin="normal" />}
        <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth margin="normal" />
        <Button variant="contained" type="submit" sx={{mt:1}}>Login</Button>
        {err && <Typography color="error" sx={{mt:1}}>{err}</Typography>}
        <Typography variant="caption" display="block" sx={{mt:1}}>Teacher: teacher@example.com / teacher123 · Students: student123 or their ID</Typography>
      </form>
    </CardContent></Card>
  )
}
