import * as React from 'react';
import { useState } from 'react';
import {
  Box, Button, CssBaseline, Divider, FormLabel, FormControl, Link, TextField, Typography, Stack, Card as MuiCard
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import dayjs from 'dayjs';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import { ThemeProvider, styled } from '@mui/material/styles';
import AppTheme from '../../../src/shared-theme/AppTheme';
import { GoogleIcon } from './CustomIcons';
import { GTAppBar } from '../../components/AppBar'
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: { width: '450px' }
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  padding: theme.spacing(2),
  backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))'
}));

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', repeatPassword: '', birthday: '' });
  const { t, i18n } = useTranslation();
  const { language = 'en' } = useParams();

  const countries = worldMap.features.map((feature) => feature.properties.name);

  React.useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const validateInputs = () => {
    const newErrors = { name: '', email: '', password: '', repeatPassword: '', birthday: '' };

    if (!name) newErrors.name = 'Name is required.';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters long.';
    if (password !== repeatPassword) newErrors.repeatPassword = 'Passwords do not match.';
    if (!birthday || dayjs(birthday).isAfter(dayjs())) newErrors.birthday = 'Please enter a valid birthday.';

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const countriesArray = Array.isArray(selectedCountries) 
        ? selectedCountries 
        : JSON.parse(selectedCountries.replace(/\\/g, ''));
    
    const data = {
      name: name,
      email: email,
      password: password,
      birthday: birthday.format('YYYY-MM-DD'),
      countries: countriesArray
    };

    try {
      const signupResponse = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    
      if (!signupResponse.ok) {
        return;
      }
    
      const loginResponse = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });
    
      if (!loginResponse.ok) {
        return;
      }
    
      const loginData = await loginResponse.json();
    
      localStorage.setItem("access_token", loginData.access_token);
      window.location.href = `/Globetrek/${language}/home/${loginData.user_id}`;
    } catch (error) {
      console.error('Request error:', error);
    }
    
  };

  return (
    <ThemeProvider theme={AppTheme}>
      <CssBaseline enableColorScheme />
      <GTAppBar withMenu={false}/>
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined" sx={{marginTop: '10vh'}}>
          <Typography component="h1" variant="h4">{t('Sign up')}</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl>
              <FormLabel htmlFor="name">{t('Full name')}</FormLabel>
              <TextField
                name="name" fullWidth required placeholder={t("Your full name")}
                value={name} onChange={(e) => setName(e.target.value)}
                error={!!errors.name} helperText={errors.name}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">{t('Email')}</FormLabel>
              <TextField
                name="email" fullWidth required placeholder={t("your@email.com")}
                value={email} onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email} helperText={errors.email}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="birthday">{t('Birthday')}</FormLabel>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={t("Select your birthday")} value={birthday}
                  onChange={(newValue) => setBirthday(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth error={!!errors.birthday} helperText={errors.birthday} />
                  )}
                />
              </LocalizationProvider>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="visitedCountries">Places you've visited</FormLabel>
              <Autocomplete
                multiple limitTags={1} disableCloseOnSelect options={countries}
                getOptionLabel={(option) => option} onChange={(event, newValue) => setSelectedCountries(newValue)}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} />{option}</li>
                )}
                renderInput={(params) => <TextField {...params} variant="outlined" placeholder={t("Select countries")} />}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">{t('Password')}</FormLabel>
              <TextField
                name="password" fullWidth required type="password" placeholder="••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password} helperText={errors.password}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="repeatPassword">{t('Repeat password')}</FormLabel>
              <TextField
                name="repeatPassword" fullWidth required type="password" placeholder="••••••"
                value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)}
                error={!!errors.repeatPassword} helperText={errors.repeatPassword}
              />
            </FormControl>
            <Button type="submit" fullWidth variant="contained">{t('Sign up')}</Button>
            <Typography sx={{ textAlign: 'center' }}>
              {t('Already have an account?')} <Link href={`/GlobeTrek/${language}/login`}>{t('Sign in')}</Link>
            </Typography>
          </Box>
          <Divider>
            <Typography>{t('or')}</Typography>
          </Divider>
          <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                localStorage.setItem("language", language);
                const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/api/login`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                } 
              }
              }}
              startIcon={<GoogleIcon />}
            >
              {t('Sign in with Google')}
            </Button>
        </Card>
      </SignUpContainer>
    </ThemeProvider>
  );
}
