import React, {useEffect, useState, useMemo} from 'react';
import axios from 'axios';
import { Button, Card, CardContent, Typography, Grid, Box, TextField, CircularProgress, Tabs, Tab } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ScatterChart, Scatter, LineChart, Line, CartesianGrid } from 'recharts';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const COLORS = ['#00C49F','#FF8042'];

export default function TeacherDashboard({token, onLogout}){
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dataAnalysis, setDataAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(()=>{ fetchStudents(); }, []);
  
  // Generate data analysis whenever student data changes
  useEffect(() => {
    if (students.length > 0) {
      analyzeData();
    }
  }, [students]);
  
  // Function to analyze the student data and generate insights
  const analyzeData = () => {
    setIsAnalyzing(true);
    try {
      // Calculate statistics
      const analysis = {
        totalStudents: students.length,
        passRate: students.filter(s => (s.result || '').toLowerCase() === 'pass').length / students.length * 100,
        averageHours: calculateAverage(students, 'Hours_Studied'),
        averageAttendance: calculateAverage(students, 'Attendance'),
        averageScore: calculateAverage(students, 'Previous_Scores'),
        correlationHoursResult: calculateCorrelation(students, 'Hours_Studied', 'result'),
        correlationAttendanceResult: calculateCorrelation(students, 'Attendance', 'result'),
        correlationScoreResult: calculateCorrelation(students, 'Previous_Scores', 'result'),
        genderDistribution: calculateDistribution(students, 'Gender'),
        parentalInvolvementDistribution: calculateDistribution(students, 'Parental_Involvement'),
        learningDisabilitiesDistribution: calculateDistribution(students, 'Learning_Disabilities'),
      };
      
      setDataAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Helper functions for data analysis
  const calculateAverage = (data, field) => {
    const values = data
      .map(item => Number(item[field] || 0))
      .filter(val => !isNaN(val));
    
    return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  };
  
  const calculateDistribution = (data, field) => {
    const distribution = {};
    data.forEach(item => {
      const value = item[field] || 'Unknown';
      distribution[value] = (distribution[value] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };
  
  const calculateCorrelation = (data, field, resultField) => {
    // Simple correlation - percentage of passing students per value range
    const ranges = {};
    const rangeSize = 10;
    
    data.forEach(item => {
      const value = Number(item[field] || 0);
      if (!isNaN(value)) {
        const rangeKey = Math.floor(value / rangeSize) * rangeSize;
        if (!ranges[rangeKey]) {
          ranges[rangeKey] = { total: 0, pass: 0 };
        }
        ranges[rangeKey].total++;
        if ((item[resultField] || '').toLowerCase() === 'pass') {
          ranges[rangeKey].pass++;
        }
      }
    });
    
    return Object.entries(ranges).map(([range, stats]) => ({
      name: `${range}-${Number(range) + rangeSize}`,
      passRate: (stats.pass / stats.total) * 100,
      count: stats.total
    }));
  };

  const fetchStudents = async ()=>{
    try{ const res = await axios.get(API + '/students', {headers:{Authorization:'Bearer '+token}}); setStudents(res.data||[]); } catch(e){ console.error(e); }
  };

  // File upload and retrain functionality removed

  const passFail = [{name:'Pass', value: students.filter(s=> (s.result||'').toString().toLowerCase()==='pass').length},{name:'Fail', value: students.filter(s=> (s.result||'').toString().toLowerCase()!=='pass').length}];

  return (
    <Box sx={{p:2}}>
      <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Typography variant="h5">Teacher Dashboard</Typography>
        <Box>
          <Button variant="contained" color="error" onClick={onLogout}>Logout</Button>
        </Box>
      </Box>
      <Typography sx={{mt:1}}>Parameters: Hours_Studied, Attendance, Parental_Involvement, Access_to_Resources, Previous_Scores, Internet_Access, Tutoring_Sessions, Family_Income, Peer_Influence, Learning_Disabilities, Parental_Education_Level, Distance_from_Home, Gender, result</Typography>
      
      <Box sx={{borderBottom: 1, borderColor: 'divider', mt: 2}}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Upload & Data" />
          <Tab label="Analytics & Visualizations" />
          <Tab label="Prediction Tool" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Grid container spacing={2} sx={{mt:1}}>
          <Grid item xs={12} md={6}><Card className="dashboard-card"><CardContent><Typography variant="h6" className="card-header">Pass / Fail Distribution</Typography><ResponsiveContainer width="100%" height={250} className="chart-container fade-in"><PieChart>
            <Pie 
              data={passFail} 
              dataKey="value" 
              nameKey="name" 
              outerRadius={80} 
              label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            >
              {passFail.map((entry,idx)=>(<Cell key={idx} fill={COLORS[idx%COLORS.length]} />))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
            <Legend />
          </PieChart></ResponsiveContainer></CardContent></Card></Grid>
          
          <Grid item xs={12} md={6}><Card className="dashboard-card"><CardContent><Typography variant="h6" className="card-header">Hours vs Previous Score (sample)</Typography><ResponsiveContainer width="100%" height={250} className="chart-container fade-in"><BarChart data={students.slice(0,200).map(s=>({name: s.Student_Name || s.name || s.student_id, hours: Number(s.Hours_Studied||0), score: Number(s.Previous_Scores||0)}))}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Legend /><Bar name="Hours Studied" dataKey="hours" fill="#8884d8" /><Bar name="Previous Score" dataKey="score" fill="#82ca9d" /></BarChart></ResponsiveContainer></CardContent></Card></Grid>
          
          <Grid item xs={12}><Card className="dashboard-card"><CardContent><Typography variant="h6" className="card-header">Student Records (first 300)</Typography><Box sx={{overflow:'auto', maxHeight:360}} className="fade-in"><table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr><th style={{border:'1px solid #eee', padding:6}}>ID</th><th style={{border:'1px solid #eee', padding:6}}>Name</th><th style={{border:'1px solid #eee', padding:6}}>Hours</th><th style={{border:'1px solid #eee', padding:6}}>Attendance</th><th style={{border:'1px solid #eee', padding:6}}>Prev Score</th><th style={{border:'1px solid #eee', padding:6}}>Result</th></tr></thead><tbody>{students.slice(0,300).map(s=>(<tr key={s.student_id}><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.student_id}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Student_Name || s.name || ''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Hours_Studied||''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Attendance||''}</td><td style={{border:'1px solid #f0f0f0', padding:6}}>{s.Previous_Scores||''}</td><td style={{border:'1px solid #f0f0f0', padding:6, backgroundColor: s.result?.toLowerCase() === 'pass' ? '#e8f5e9' : (s.result?.toLowerCase() === 'fail' ? '#ffebee' : 'transparent'), fontWeight: 'bold', color: s.result?.toLowerCase() === 'pass' ? '#2e7d32' : (s.result?.toLowerCase() === 'fail' ? '#c62828' : 'inherit')}}>{s.result || 'Unknown'}</td></tr>))}</tbody></table></Box></CardContent></Card></Grid>
        </Grid>
      )}
      
      {activeTab === 1 && (
        <Grid container spacing={2} sx={{mt:1}}>
          {isAnalyzing ? (
            <Grid item xs={12} sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px'}}>
              <CircularProgress />
              <Typography sx={{ml: 2}}>Analyzing student data...</Typography>
            </Grid>
          ) : dataAnalysis ? (
            <>
              <Grid item xs={12}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Data Summary</Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2}}>
                      <Box>
                        <Typography variant="subtitle2">Total Students</Typography>
                        <Typography variant="h4">{dataAnalysis.totalStudents}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Pass Rate</Typography>
                        <Typography variant="h4" color={dataAnalysis.passRate >= 70 ? 'success.main' : 'error.main'}>
                          {dataAnalysis.passRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Avg. Study Hours</Typography>
                        <Typography variant="h4">{dataAnalysis.averageHours.toFixed(1)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Avg. Attendance</Typography>
                        <Typography variant="h4">{dataAnalysis.averageAttendance.toFixed(1)}%</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Avg. Previous Score</Typography>
                        <Typography variant="h4">{dataAnalysis.averageScore.toFixed(1)}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Study Hours vs. Pass Rate</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataAnalysis.correlationHoursResult}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" label={{ value: 'Hours Range', position: 'insideBottom', offset: 0 }} />
                        <YAxis label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Pass Rate']} />
                        <Line type="monotone" dataKey="passRate" stroke="#8884d8" name="Pass Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Attendance vs. Pass Rate</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataAnalysis.correlationAttendanceResult}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" label={{ value: 'Attendance Range (%)', position: 'insideBottom', offset: 0 }} />
                        <YAxis label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Pass Rate']} />
                        <Line type="monotone" dataKey="passRate" stroke="#82ca9d" name="Pass Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Gender Distribution</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dataAnalysis.genderDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Parental Involvement Distribution</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dataAnalysis.parentalInvolvementDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#82ca9d" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card className="dashboard-card">
                  <CardContent>
                    <Typography variant="h6" className="card-header">Performance Scatter Plot</Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="hours" name="Hours Studied" label={{ value: 'Hours Studied', position: 'insideBottomRight', offset: -5 }} />
                        <YAxis type="number" dataKey="score" name="Previous Score" label={{ value: 'Previous Score', angle: -90, position: 'insideLeft' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter
                          name="Pass"
                          data={students.filter(s => (s.result||'').toLowerCase() === 'pass').map(s => ({
                            hours: Number(s.Hours_Studied || 0),
                            score: Number(s.Previous_Scores || 0),
                            id: s.student_id
                          }))}
                          fill="#4caf50"
                        />
                        <Scatter
                          name="Fail"
                          data={students.filter(s => (s.result||'').toLowerCase() === 'fail').map(s => ({
                            hours: Number(s.Hours_Studied || 0),
                            score: Number(s.Previous_Scores || 0),
                            id: s.student_id
                          }))}
                          fill="#f44336"
                        />
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography>No data analysis available. Upload or refresh data to generate analytics.</Typography>
                  <Button sx={{mt: 2}} variant="contained" onClick={analyzeData}>Analyze Data</Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
      
      {activeTab === 2 && (
        <Grid container spacing={2} sx={{mt:1}}>
          <Grid item xs={12}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" className="card-header">Prediction Form (Teacher only)</Typography>
                <Typography variant="body2" color="text.secondary">Use this form to predict using the trained model</Typography>
                <Box sx={{mt:1}}><PredictionForm token={token} /></Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

function PredictionForm({token}){
  const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
  const fields = [
    {key:'Student_Name', label:'Student Name', type:'text'},
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
            f.type==='text' ?
            <input type='text' value={form[f.key]} onChange={e=>setForm({...form, [f.key]: e.target.value})} /> :
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
    
    {res && <Box 
      className={`result-card fade-in ${res.error ? '' : (res.prediction === 'Pass' ? 'pass' : 'fail')}`}
      sx={{ mt:2, p:2 }}>
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
