import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  Container,
  Box,
  AppBar,
  Toolbar,
  Chip
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import MapIcon from '@mui/icons-material/Map';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NatureIcon from '@mui/icons-material/Nature'; // Replacement for Eco
import PublicIcon from '@mui/icons-material/Public'; // Additional icon
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: <ScienceIcon sx={{ fontSize: 40 }} />,
      title: "Automated Computation",
      description: "Calculate heavy metal pollution indices using standard methodologies with minimal manual intervention"
    },
    {
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      title: "Geo-Integrated Data",
      description: "Integrate groundwater datasets with geo-coordinates for comprehensive spatial analysis"
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: "Quality Categorization",
      description: "Automatically categorize groundwater quality based on heavy metal presence and concentration levels"
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and visualization tools for detailed water quality analysis"
    },
    {
      icon: <BatchPredictionIcon sx={{ fontSize: 40 }} />,
      title: "Batch Processing",
      description: "Process multiple samples simultaneously with our efficient batch computation system"
    },
    {
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      title: "Data Management",
      description: "Organize and manage your groundwater data with our intuitive data management system"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Calculation Accuracy" },
    { value: "10x", label: "Faster Analysis" },
    { value: "1000+", label: "Samples Processed" },
    { value: "24/7", label: "Platform Availability" }
  ];

  return (
    <div className="landing-container">
      {/* Navigation */}
      <AppBar position="static" className="landing-navbar" elevation={1}>
        <Toolbar>
          <Box className="landing-nav-brand">
            <Typography variant="h4" component="h1" className="brand-text">
              HYDRO INDEX
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box className="landing-nav-actions">
            <Button 
              component={Link} 
              to="/login" 
              className="landing-nav-link"
              variant="outlined"
            >
              Log in
            </Button>
            <Button 
              component={Link} 
              to="/signup" 
              className="landing-nav-button"
              variant="contained"
            >
              Sign up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <Container maxWidth="lg">
          <Box className="landing-hero-content">
            <Typography variant="h2" component="h1" className="hero-title">
              Advanced Groundwater Quality Assessment
            </Typography>
            <Typography variant="h5" className="hero-subtitle">
              Precision tools for heavy metal pollution analysis and environmental monitoring
            </Typography>
            
            <Box className="landing-hero-actions">
              <Button 
                component={Link} 
                to="/app/batch" 
                className="landing-cta-button primary"
                variant="contained"
                size="large"
                startIcon={<ScienceIcon />}
              >
                Start Calculating
              </Button>
              <Button 
                component={Link} 
                to="/app/single" 
                className="landing-cta-button secondary"
                variant="outlined"
                size="large"
                startIcon={<WaterDropIcon />}
              >
                Try Demo
              </Button>
            </Box>
          </Box>
        </Container>
      </section>

      {/* Introduction Section */}
      <section className="landing-intro-section">
        <Container maxWidth="lg">
          <Box className="landing-intro-content">
            <Typography variant="h3" component="h2" className="section-title">
              Introducing Hydro Index
            </Typography>
            <Typography variant="h6" className="intro-text">
              Hydro Index is a comprehensive platform designed specifically for environmental scientists, 
              hydrologists, and researchers working on groundwater quality assessment. Our advanced algorithms 
              automate the computation of various heavy metal pollution indices, providing accurate and 
              reliable results for water quality monitoring and environmental impact studies.
            </Typography>
            <Grid container spacing={4} className="landing-intro-features" justifyContent="center">
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box className="landing-intro-feature">
                  <SecurityIcon className="feature-icon" />
                  <Typography variant="h6" className="feature-title" sx={{ 
                    textAlign: 'center',
                    minHeight: { xs: 'auto', md: 60 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Scientific Accuracy
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box className="landing-intro-feature">
                  <SpeedIcon className="feature-icon" />
                  <Typography variant="h6" className="feature-title" sx={{ 
                    textAlign: 'center',
                    minHeight: { xs: 'auto', md: 60 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Fast Computation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box className="landing-intro-feature">
                  <PublicIcon className="feature-icon" />
                  <Typography variant="h6" className="feature-title" sx={{ 
                    textAlign: 'center',
                    minHeight: { xs: 'auto', md: 60 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Environmental Focus
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </section>

      {/* Features Section */}
      <section className="landing-features-section">
        <Container maxWidth="xl">
          <Typography variant="h3" component="h2" className="section-title">
            Powerful Features
          </Typography>
          <Grid container spacing={4} className="landing-features-grid" justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} lg={4} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card className={`landing-feature-card feature-card-${index + 1}`} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  maxWidth: 400
                }}>
                  <CardContent className="feature-card-content" sx={{ flexGrow: 1 }}>
                    <Box className="feature-icon-wrapper">
                      {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                    </Box>
                    <Typography variant="h5" component="h3" className="feature-card-title" sx={{ 
                      textAlign: 'center',
                      minHeight: { xs: 'auto', md: 60 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" className="feature-card-description" sx={{ 
                      textAlign: 'center',
                      flexGrow: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Impact Section - UPDATED FOR PERFECT ALIGNMENT */}
      <section className="landing-impact-section">
        <Container maxWidth="lg">
          <Box className="landing-impact-content">
            <Typography variant="h3" component="h2" className="impact-title">
              Making a Difference in Water Quality
            </Typography>
            <Typography variant="h6" className="impact-text">
              Hydro Index provides accessible and reliable insights into groundwater heavy metal contamination, 
              enabling better decision-making, enhanced environmental monitoring, and improved public health protection.
            </Typography>
            <Grid container spacing={4} className="landing-impact-stats" justifyContent="center">
              {stats.map((stat, index) => (
                <Grid item xs={6} sm={6} md={3} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box className="impact-stat">
                    <Typography variant="h3" component="h3" className="stat-value">
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" className="stat-label">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <Container maxWidth="xl">
          <Grid container spacing={4} className="landing-footer-content">
            <Grid item xs={12} md={4}>
              <Box className="landing-footer-section">
                <Typography variant="h5" className="footer-brand">
                  HYDRO INDEX
                </Typography>
                <Typography variant="body2" className="footer-description">
                  Advanced groundwater quality assessment platform for environmental research and monitoring.
                </Typography>
                <Box className="landing-footer-status">
                  <Chip 
                    label="All Systems Operational" 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box className="landing-footer-section">
                <Typography variant="h6" className="footer-heading">
                  Research
                </Typography>
                <ul>
                  <li>Heavy Metal Index</li>
                  <li>Contamination Factor</li>
                  <li>Pollution Load Index</li>
                  <li>Geo-accumulation Index</li>
                </ul>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box className="landing-footer-section">
                <Typography variant="h6" className="footer-heading">
                  Product
                </Typography>
                <ul>
                  <li>Single Sample Analysis</li>
                  <li>Batch Processing</li>
                  <li>Data Management</li>
                  <li>Historical Reports</li>
                </ul>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box className="landing-footer-section">
                <Typography variant="h6" className="footer-heading">
                  Legal & Safety
                </Typography>
                <ul>
                  <li>Privacy Policy</li>
                  <li>Terms of Use</li>
                  <li>Data Security</li>
                  <li>Compliance</li>
                </ul>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box className="landing-footer-section">
                <Typography variant="h6" className="footer-heading">
                  Support
                </Typography>
                <ul>
                  <li>Documentation</li>
                  <li>Contact Us</li>
                  <li>API Reference</li>
                  <li>Community</li>
                </ul>
              </Box>
            </Grid>
          </Grid>
          <Box className="landing-footer-bottom">
            <Typography variant="body2" className="footer-copyright">
              © 2024 Hydro Index. All rights reserved. Dedicated to cleaner water and healthier environments.
            </Typography>
          </Box>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;