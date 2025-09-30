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
      <Card sx={{mt:2, backgroundColor: isPassing ? '#e8f5e9' : '#ffebee', border: `1px solid ${isPassing ? '#4caf50' : '#ef5350'}`}}>
        <CardContent>
          <Typography variant="h6" sx={{color: isPassing ? '#2e7d32' : '#c62828', fontWeight: 'bold'}}>
            Prediction: {me.result}
          </Typography>
          
          {probability !== null && (
            <Typography variant="body1" sx={{mt:1}}>
              Confidence: {probability.toFixed(1)}%
            </Typography>
          )}
          
          <Typography variant="body2" sx={{mt:2, fontStyle: 'italic'}}>
            {isPassing ? 
              'Great job! Based on your academic performance, you are predicted to pass.' : 
              'Based on your current performance, you may need additional support to pass. Consider seeking help from teachers.'}
          </Typography>
          
          <Box sx={{mt:2}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>Key Factors:</Typography>
            <ul style={{margin: '8px 0'}}>
              <li>Hours Studied: {me.Hours_Studied || 'N/A'} hours {Number(me.Hours_Studied) >= 5 ? '✅' : '⚠️'}</li>
              <li>Previous Scores: {me.Previous_Scores || 'N/A'} {Number(me.Previous_Scores) >= 50 ? '✅' : '⚠️'}</li>
              <li>Attendance: {me.Attendance || 'N/A'}% {Number(me.Attendance) >= 70 ? '✅' : '⚠️'}</li>
              {me.Tutoring_Sessions && <li>Tutoring Sessions: {me.Tutoring_Sessions} sessions</li>}
            </ul>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{p:2}}>
      <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Typography variant="h5">Student Dashboard</Typography>
        <Button variant="contained" color="error" onClick={onLogout}>Logout</Button>
      </Box>
      
      {me && getPredictionCard()}
      
      <Card sx={{mt:2}}><CardContent>
        <Typography variant="h6">Your Details</Typography>
        {me ? (
          <div>
            <table style={{width:'100%'}}>
              <tbody>
                {Object.keys(me)
                  .filter(k => k !== 'prediction_probability') // Hide technical fields
                  .map(k => (
                    <tr key={k}>
                      <td style={{padding:6, fontWeight:'600'}}>{k}</td>
                      <td style={{padding:6}}>{String(me[k])}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : <Typography>Loading...</Typography>}
      </CardContent></Card>
      
      {me && me.result && (
        <Card sx={{mt:2}}><CardContent>
          <Typography variant="h6">Improvement Tips</Typography>
          <Box sx={{mt:1}}>
            <ul>
              {Number(me.Hours_Studied) < 5 && (
                <li><Typography>Consider increasing your study hours to at least 5 hours.</Typography></li>
              )}
              {Number(me.Attendance) < 70 && (
                <li><Typography>Try to improve your attendance to at least 70%.</Typography></li>
              )}
              {Number(me.Previous_Scores) < 50 && (
                <li><Typography>Focus on improving your previous scores through regular practice.</Typography></li>
              )}
              {Number(me.Tutoring_Sessions || 0) < 3 && (
                <li><Typography>Consider attending more tutoring sessions for additional help.</Typography></li>
              )}
              <li><Typography>Connect with teachers for personalized guidance on improving your performance.</Typography></li>
            </ul>
          </Box>
        </CardContent></Card>
      )}
    </Box>
  )
}
