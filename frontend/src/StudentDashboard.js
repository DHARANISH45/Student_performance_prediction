import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function StudentDashboard({token, onLogout}){
  const [me, setMe] = useState(null);
  useEffect(()=>{ (async ()=>{ try{ const res = await axios.get(API + '/students', {headers:{Authorization:'Bearer '+token}}); setMe(res.data); }catch(e){ console.error(e); } })(); }, []);

  // Format the prediction display
  const getPredictionCard = () => {
    if (!me || !me.result) return null;
    
    const isPassing = me.result.toLowerCase() === 'pass';
    const probability = me.prediction_probability ? Number(me.prediction_probability) * 100 : null;
    
    return (
      <Card className={`prediction-card ${isPassing ? 'pass-card' : 'fail-card'}`} sx={{mt:2, backgroundColor: isPassing ? '#e8f5e9' : '#ffebee', border: `1px solid ${isPassing ? '#4caf50' : '#ef5350'}`}}>
        <CardContent>
          <Typography variant="h6" className="prediction-title" sx={{color: isPassing ? '#2e7d32' : '#c62828', fontWeight: 'bold'}}>
            Prediction: {me.result}
          </Typography>
          
          {probability !== null && (
            <Typography variant="body1" className="confidence-display" sx={{mt:1}}>
              Confidence: <span className="confidence-value">{probability.toFixed(1)}%</span>
            </Typography>
          )}
          
          <Typography variant="body2" className="prediction-message" sx={{mt:2, fontStyle: 'italic'}}>
            {isPassing ? 
              'Great job! Based on your academic performance, you are predicted to pass.' : 
              'Based on your current performance, you may need additional support to pass. Consider seeking help from teachers.'}
          </Typography>
          
          <Box sx={{mt:2}} className="key-factors">
            <Typography variant="subtitle2" className="factors-title" sx={{fontWeight: 'bold'}}>Key Factors:</Typography>
            <ul className="factors-list" style={{margin: '8px 0'}}>
              <li className="factor-item">Hours Studied: <span className="factor-value">{me.Hours_Studied || 'N/A'}</span> hours {Number(me.Hours_Studied) >= 5 ? '✅' : '⚠️'}</li>
              <li className="factor-item">Previous Scores: <span className="factor-value">{me.Previous_Scores || 'N/A'}</span> {Number(me.Previous_Scores) >= 50 ? '✅' : '⚠️'}</li>
              <li className="factor-item">Attendance: <span className="factor-value">{me.Attendance || 'N/A'}%</span> {Number(me.Attendance) >= 70 ? '✅' : '⚠️'}</li>
              {me.Tutoring_Sessions && <li className="factor-item">Tutoring Sessions: <span className="factor-value">{me.Tutoring_Sessions}</span> sessions</li>}
            </ul>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{p:2}} className="dashboard student-dashboard">
      <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}} className="dashboard-header">
        <Box className="title-container">
          <Typography variant="h5" className="dashboard-title">Student Dashboard</Typography>
          {me && me.Student_Name && (
            <Typography variant="h6" color="primary" sx={{mt:0.5}} className="student-welcome">
              Welcome, <span className="student-name">{me.Student_Name}</span>
            </Typography>
          )}
        </Box>
        <Button variant="contained" color="error" onClick={onLogout} className="logout-button">Logout</Button>
      </Box>
      
      {me && getPredictionCard()}
      
      <Card sx={{mt:2}} className="data-card"><CardContent>
        <Typography variant="h6" className="card-title">Your Details</Typography>
        {me ? (
          <div className="student-details-container">
            <table className="student-details-table" style={{width:'100%', borderCollapse: 'collapse'}}>
              <tbody>
                {Object.keys(me)
                  .filter(k => !['prediction_probability', '__v', '_id'].includes(k)) // Hide technical fields
                  .map(k => (
                    <tr key={k} className="detail-row">
                      <td className="detail-label" style={{padding:8, fontWeight:'600', borderBottom: '1px solid #eee'}}>{k}</td>
                      <td className="detail-value" style={{padding:8, borderBottom: '1px solid #eee'}}>{String(me[k])}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : <Typography>Loading...</Typography>}
      </CardContent></Card>
      
      {me && me.result && (
        <Card sx={{mt:2}} className="improvement-tips-card"><CardContent>
          <Typography variant="h6" className="tips-title">Improvement Tips</Typography>
          <Box sx={{mt:1}} className="tips-container">
            <ul className="tips-list">
              {Number(me.Hours_Studied) < 5 && (
                <li className="tip-item"><Typography className="tip-text">📚 Consider increasing your study hours to at least 5 hours.</Typography></li>
              )}
              {Number(me.Attendance) < 70 && (
                <li className="tip-item"><Typography className="tip-text">📅 Try to improve your attendance to at least 70%.</Typography></li>
              )}
              {Number(me.Previous_Scores) < 50 && (
                <li className="tip-item"><Typography className="tip-text">📈 Focus on improving your previous scores through regular practice.</Typography></li>
              )}
              {Number(me.Tutoring_Sessions || 0) < 3 && (
                <li className="tip-item"><Typography className="tip-text">👨‍🏫 Consider attending more tutoring sessions for additional help.</Typography></li>
              )}
              <li className="tip-item"><Typography className="tip-text">🤝 Connect with teachers for personalized guidance on improving your performance.</Typography></li>
            </ul>
          </Box>
        </CardContent></Card>
      )}
    </Box>
  )
}
