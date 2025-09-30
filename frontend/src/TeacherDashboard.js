import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Button, Card, CardContent, Typography, Grid, Box, TextField } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const COLORS = ['#00C49F','#FF8042'];

export default function TeacherDashboard({token, onLogout}){
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  useEffect(()=>{ fetchStudents(); }, []);

  const fetchStudents = async ()=>{
    try{ const res = await axios.get(API + '/students', {headers:{Authorization:'Bearer '+token}}); setStudents(res.data||[]); } catch(e){ console.error(e); }
  };

  const handleUpload = async (e) => {
    if(!file) return;
    
    // Validate file size before uploading
    if(file.size > 52428800) { // 50MB in bytes
      setStatus('Error: File size exceeds 50MB limit');
      return;
    }
    
    // Check file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if(!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      setStatus('Error: Only CSV and Excel files (.csv, .xlsx, .xls) are supported');
      return;
    }
    
    setStatus('Uploading... Please wait for large files');
    setIsUploading(true);
    
    const fd = new FormData(); 
    fd.append('file', file);
    
    try{
      const res = await axios.post(API + '/upload', fd, {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'multipart/form-data'
        },
        // Add timeout and progress tracking for large files
        timeout: 300000, // 5 minutes timeout for large files
      });
      
      setStatus(`Success: ${res.data.message || 'File uploaded successfully'}`);
      // Refresh student data after upload
      fetchStudents();
      // Clear file selection after successful upload
      setFile(null);
      
    } catch(e){ 
      console.error('Upload error:', e);
      setStatus('Error: ' + (e.response?.data?.message || e.message || 'Upload failed')); 
    } finally {
      setIsUploading(false);
    }
  };

  const retrain = async ()=>{
    setStatus('Retraining... This may take several minutes for large datasets');
    setIsTraining(true);
    try{ 
      const res = await axios.post(API + '/train', {}, {
        headers: {Authorization: 'Bearer ' + token},
        timeout: 600000 // 10 minutes timeout for training large models
      }); 
      setStatus(res.data.message || 'Model successfully retrained'); 
      fetchStudents(); 
    } catch(e){ 
      setStatus('Error: ' + (e.response?.data?.message || e.message)); 
    } finally {
      setIsTraining(false);
    }
  };

  const passFail = [{name:'Pass', value: students.filter(s=> (s.result||'').toString().toLowerCase()==='pass').length},{name:'Fail', value: students.filter(s=> (s.result||'').toString().toLowerCase()!=='pass').length}];

  return (
    <Box sx={{p:2}}>
      <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><Typography variant="h5">Teacher Dashboard</Typography><Box><Button variant="contained" color="error" onClick={onLogout}>Logout</Button></Box></Box>
      <Typography sx={{mt:1}}>Parameters: Hours_Studied, Attendance, Parental_Involvement, Access_to_Resources, Previous_Scores, Internet_Access, Tutoring_Sessions, Family_Income, Peer_Influence, Learning_Disabilities, Parental_Education_Level, Distance_from_Home, Gender, result</Typography>
      <Grid container spacing={2} sx={{mt:1}}>
        <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Pass / Fail</Typography><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={passFail} dataKey="value" nameKey="name" outerRadius={70}>{passFail.map((entry,idx)=>(<Cell key={idx} fill={COLORS[idx%COLORS.length]} />))}</Pie></PieChart></ResponsiveContainer></CardContent></Card></Grid>
        <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Hours vs Previous Score (sample)</Typography><ResponsiveContainer width="100%" height={200}><BarChart data={students.slice(0,200).map(s=>({name: s.name||s.student_id, hours: Number(s.Hours_Studied||0), score: Number(s.Previous_Scores||0)}))}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="hours" /><Bar dataKey="score" /></BarChart></ResponsiveContainer></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Upload Student Data (CSV or Excel)</Typography><Box sx={{display:'flex', flexDirection: 'column', gap:1, mt:1}}>
          <Box sx={{display:'flex', gap:1, alignItems: 'center'}}>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files[0])} />
            <Button 
              variant="contained" 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              sx={{ minWidth: '100px' }}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button 
              variant="contained" 
              onClick={retrain}
              disabled={isTraining}
              sx={{ minWidth: '100px' }}
            >
              {isTraining ? 'Training...' : 'Retrain'}
            </Button>
          </Box>
          <Typography sx={{mt:1, fontWeight: file ? 'bold' : 'normal'}} color={status.includes('Error') ? 'error' : 'text.secondary'}>
            {file ? `Selected: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)` : 'Select a CSV or Excel file'}
          </Typography>
          <Typography sx={{mt:1}} color={status.includes('Error') ? 'error' : 'text.secondary'}>{status}</Typography>
        </Box></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Student Records (first 300)</Typography><Box sx={{overflow:'auto', maxHeight:360}}><table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr><th style={{border:'1px solid #eee', padding:6}}>ID</th><th style={{border:'1px solid #eee', padding:6}}>Name</th><th style={{border:'1px solid #eee', padding:6}}>Hours</th><th style={{border:'1px solid #eee', padding:6}}>Attendance</th><th style={{border:'1px solid #eee', padding:6}}>Prev Score</th><th style={{border:'1px solid #eee', padding:6}}>Result</th></tr></thead><tbody>{students.slice(0,300).map(s=>(<tr key={s.student_id}><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.student_id}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.name||''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Hours_Studied||''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Attendance||''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Previous_Scores||''}</td><td style={{border:'1px solid #f0f0f0', padding:6, backgroundColor: s.result?.toLowerCase() === 'pass' ? '#e8f5e9' : (s.result?.toLowerCase() === 'fail' ? '#ffebee' : 'transparent'), fontWeight: 'bold', color: s.result?.toLowerCase() === 'pass' ? '#2e7d32' : (s.result?.toLowerCase() === 'fail' ? '#c62828' : 'inherit')}}>{s.result || 'Unknown'}</td></tr>))}</tbody></table></Box></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Prediction Form (Teacher only)</Typography><Typography variant="body2" color="text.secondary">Use this form to predict using the trained model</Typography><Box sx={{mt:1}}><PredictionForm token={token} /></Box></CardContent></Card></Grid>
      </Grid>
    </Box>
  )
}

function PredictionForm({token}){
  const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
  const fields = [
    {key:'Hours_Studied', label:'Hours Studied', type:'number'},
    {key:'Attendance', label:'Attendance (%)', type:'number'},
    {key:'Parental_Involvement', label:'Parental Involvement', type:'select', options:['Low','Medium','High']},
    {key:'Access_to_Resources', label:'Access to Resources', type:'select', options:['Yes','No']},
    {key:'Previous_Scores', label:'Previous Scores', type:'number'},
    {key:'Internet_Access', label:'Internet Access', type:'select', options:['Yes','No']},
    {key:'Tutoring_Sessions', label:'Tutoring Sessions', type:'number'},
    {key:'Family_Income', label:'Family Income', type:'number'},
    {key:'Peer_Influence', label:'Peer Influence', type:'select', options:['Positive','Neutral','Negative']},
    {key:'Learning_Disabilities', label:'Learning Disabilities', type:'select', options:['No','Yes']},
    {key:'Parental_Education_Level', label:'Parental Education Level', type:'select', options:['Primary','Secondary','Graduate','Postgraduate']},
    {key:'Distance_from_Home', label:'Distance from Home (km)', type:'number'},
    {key:'Gender', label:'Gender', type:'select', options:['Female','Male','Other']}
  ];
  const [form, setForm] = React.useState(Object.fromEntries(fields.map(f=>[f.key, f.type==='number'?0:''])));
  const [res, setRes] = React.useState(null);
  const submit = async ()=>{
    try{
      const payload = {...form};
      fields.forEach(f=>{ if(f.type==='number') payload[f.key] = Number(payload[f.key]); });
      const axios = await import('axios').then(m=>m.default);
      const r = await axios.post(API + '/predict', payload, {headers:{Authorization:'Bearer '+token}});
      setRes(r.data);
    }catch(e){ setRes({error: e.response?.data?.message || e.message}); }
  };
  return (<div>
    <Grid container spacing={1}>
      {fields.map(f=>(<Grid item xs={12} md={6} key={f.key}>
        <Box sx={{display:'flex', flexDirection:'column'}}>
          <Typography variant="body2">{f.label}</Typography>
          {f.type==='number' ? 
            <input type='number' value={form[f.key]} onChange={e=>setForm({...form, [f.key]: e.target.value})} /> : 
            <select value={form[f.key]} onChange={e=>setForm({...form, [f.key]: e.target.value})}>
              <option value=''>--</option>
              {f.options.map(o=>(<option key={o} value={o}>{o}</option>))}
            </select>
          }
        </Box>
      </Grid>))}
    </Grid>
    
    <Box sx={{mt:2}}>
      <Button variant="contained" onClick={submit}>Predict Student Outcome</Button>
    </Box>
    
    {res && <Box sx={{
      mt:2, 
      p:2, 
      borderRadius: 1,
      backgroundColor: res.error ? '#ffebee' : 
                      (res.prediction === 'Pass' ? '#e8f5e9' : '#ffebee'),
      border: res.error ? '1px solid #ef5350' : 
              (res.prediction === 'Pass' ? '1px solid #4caf50' : '1px solid #ef5350')
    }} className='result-card'>
      {res.error ? 
        <Typography color="error">{res.error}</Typography> : 
        <Box>
          <Typography variant="h6" sx={{color: res.prediction === 'Pass' ? '#2e7d32' : '#c62828', fontWeight: 'bold'}}>
            Prediction: {res.prediction}
          </Typography>
          <Typography variant="body1" sx={{mt:1}}>
            Confidence: {(res.probability*100).toFixed(1)}%
          </Typography>
          
          <Box sx={{mt:2, mb:1}}>
            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>Key Factors:</Typography>
            <ul>
              <li>Hours Studied: {form.Hours_Studied} {Number(form.Hours_Studied) >= 5 ? '✅' : '⚠️'}</li>
              <li>Previous Scores: {form.Previous_Scores} {Number(form.Previous_Scores) >= 50 ? '✅' : '⚠️'}</li>
              <li>Attendance: {form.Attendance}% {Number(form.Attendance) >= 70 ? '✅' : '⚠️'}</li>
              <li>Parental Involvement: {form.Parental_Involvement}</li>
              <li>Access to Resources: {form.Access_to_Resources}</li>
              <li>Internet Access: {form.Internet_Access}</li>
            </ul>
          </Box>
          
          <Typography variant="body2" sx={{fontStyle: 'italic'}}>
            {res.prediction === 'Pass' ? 
              'This student is predicted to pass based on the provided information.' : 
              'This student may need additional support to improve performance.'}
          </Typography>
        </Box>
      }
    </Box>}
  </div>)
}
