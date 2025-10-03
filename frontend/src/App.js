import React, {useState} from 'react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {CssBaseline, Container, Paper, TextField, Button, Typography, Box} from '@mui/material';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import './styles.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.25px',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    }
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('teacher');
  const [error, setError] = useState('');

  function logout(){
    localStorage.removeItem('token'); 
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  }

  async function login(){
    try{
      setError('');
      const axios = await import('axios').then(m=>m.default);
      const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
      
      const res = await axios.post(API + '/login', {email, password, role:loginRole});
      if(res.data && res.data.token){
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        setToken(res.data.token);
        setRole(res.data.role);
      }
    }catch(e){
      console.error('Login error:', e);
      setError(e.response?.data?.message || 'Login failed');
    }
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container className="app" maxWidth="lg" sx={{py:2}}>
      
        <Box className="header" sx={{textAlign:'center', mb:3}}>
          <Typography variant="h4" component="h1">Student Performance Prediction System</Typography>
        </Box>
        
        {!token ? (
          <Paper elevation={3} className="auth-card">
            <Box p={3}>
              <Typography variant="h5" component="h2" gutterBottom>Login</Typography>
              <Box component="form" onSubmit={e=>{e.preventDefault(); login()}} sx={{mt:2}}>
                <TextField label="Email" fullWidth margin="normal" variant="outlined" value={email} onChange={e=>setEmail(e.target.value)} className="form-input" />
                <TextField type="password" label="Password" fullWidth margin="normal" variant="outlined" value={password} onChange={e=>setPassword(e.target.value)} className="form-input" />
                
                <Box sx={{mt:2}}>
                  <Button 
                    variant={loginRole === 'teacher' ? 'contained' : 'outlined'} 
                    onClick={() => setLoginRole('teacher')}
                    sx={{mr:1}}
                    className="role-button"
                  >
                    Teacher Login
                  </Button>
                  <Button 
                    variant={loginRole === 'student' ? 'contained' : 'outlined'} 
                    onClick={() => setLoginRole('student')}
                    className="role-button"
                  >
                    Student Login
                  </Button>
                </Box>
                
                {error && <Typography color="error" sx={{mt:2}} className="error-message">{error}</Typography>}
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{mt:3}} className="submit-button">Login</Button>
              </Box>
            </Box>
          </Paper>
        ) : role === 'teacher' ? (
          <TeacherDashboard token={token} onLogout={logout} />
        ) : (
          <StudentDashboard token={token} onLogout={logout} />
        )}
      </Container>
    </ThemeProvider>
  )
}
