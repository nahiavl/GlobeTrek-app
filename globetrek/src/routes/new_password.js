import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Dialog, DialogTitle, DialogActions} from '@mui/material';
import { GTAppBar } from '../components/AppBar'
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function NewPassword() {
  const { user_id } = useParams();

  const [data, setData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const countries = worldMap.features.map((feature) => feature.properties.name);
  const token = localStorage.getItem("access_token");
  const { language = 'en' } = useParams();
  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState(false);

  const handleDialogClose = () => setOpenDialog(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user_id) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const id = params.get('id');
        localStorage.setItem("access_token", token);
        const redirectLanguage = localStorage.getItem("language") || 'en';
        window.location.href = `/GlobeTrek/${redirectLanguage}/new_password/${id}`;
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/user/${user_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setOpenDialog(true);
          window.location.href = `/GlobeTrek/${language}/login`;
          return;
        }

        const userData = await response.json();
        setData(userData)

        if (userData.birthday) {
          setBirthday(dayjs(userData.birthday));
        }

        if (userData.password) {
          setPassword(userData.password);
        }

        if (userData.countries) {
          const parsedCountries = userData.countries.replace(/"/g, '').replace(/{|}/g, '').split(',').map((country) => country.trim());
          if (parsedCountries[0].length !== 0) {
            setSelectedCountries(parsedCountries);
          }
        }

      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchData();
  }, [user_id, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError(true);
      setPasswordErrorMessage('Passwords do not match');
      return;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');

      const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/user/${user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: password,
          birthday: birthday ? birthday.format('YYYY-MM-DD') : null,
          countries: selectedCountries
        }),
      });

      if (response.ok) {
        window.location.href = `/GlobeTrek/${language}/home/${user_id}`;
      } else {
        const errorMessage = await response.text();
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Box sx={{ "width": '40vw', marginTop: '10vh', padding: '5vh', borderRadius: '30px', backgroundColor: '#f5fafd' }}>
        <GTAppBar user_id={user_id} withMenu={true} />
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth>
            <FormLabel htmlFor="password">{t('New password')}</FormLabel>
            <TextField
              required
              fullWidth
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="new-password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              helperText={passwordError ? passwordErrorMessage : ''}
              color={passwordError ? 'error' : 'primary'}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <FormLabel htmlFor="confirm-password">{t('Confirm password')}</FormLabel>
            <TextField
              required
              fullWidth
              name="confirm-password"
              placeholder="••••••"
              type="password"
              id="confirm-password"
              autoComplete="new-password"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordError}
              helperText={passwordError ? passwordErrorMessage : ''}
              color={passwordError ? 'error' : 'primary'}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <FormLabel htmlFor="birthday">{t('Birthday')}</FormLabel>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                format="DD/MM/YYYY"
                value={birthday}
                onChange={(newValue) => setBirthday(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>

            <FormLabel htmlFor="visitedCountries" sx={{ marginTop: '3vh' }}>{t("Countries you've visited")}</FormLabel>
            <Autocomplete
              multiple limitTags={1} disableCloseOnSelect options={countries}
              getOptionLabel={(option) => option} onChange={(event, newValue) => setSelectedCountries(newValue)}
              value={selectedCountries}
              renderOption={(props, option, { selected }) => (
                <li {...props}><Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} />{option}</li>
              )}
              renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Select countries" />}
            />
          </FormControl>

          <Button type="submit" variant="contained" sx={{ backgroundColor: '#a4affe', marginTop: '3vh' }}>
            Save
          </Button>
        </form>
      </Box>
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>t("Unauthorized, please login.");</DialogTitle>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NewPassword;