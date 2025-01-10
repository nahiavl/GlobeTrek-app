import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Rating from '@mui/material/Rating';
import { Select, MenuItem, Card, CardContent, Grid, Button, Dialog, DialogTitle, DialogActions } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { GTAppBar } from '../components/AppBar'
import { useTranslation } from 'react-i18next';

const StyledSelect = styled(Select)(({ theme }) => ({
    height: '6vh',
    borderRadius: '30px',
    backgroundColor: '#beefef',
    color: '#000000',
    fontSize: 'clamp(0.9rem, 1vw, 1.1rem)',
    padding: theme.spacing(0, 0, 0, 1),
    '& .MuiSelect-select': {
        paddingRight: theme.spacing(4),
    },
    '&:focus': {
        backgroundColor: '#beefef',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#7bdfdf',
        borderWidth: '2px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#7bdfdf',
        borderWidth: '2px',
    },
    '& .MuiSvgIcon-root.MuiSelect-icon': {
        display: 'none',
    },
}));

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
    margin: theme.spacing('2vh', '1vw', '2vh', '0vw'),
    width: "8vw",
    minWidth: '145px',
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#ebebf2',
        borderRadius: '20px',
        '& fieldset': {
            borderColor: '#626c75',
        },
    },
}));

function Place() {
    const [selectedState, setSelectedState] = useState('Planning');
    const { place_id } = useParams();
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loadingOllama, setloadingOllama] = useState(false);
    const { language = 'en' } = useParams();
    const fetchedRef = useRef(false);
    const { t, i18n } = useTranslation();
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [redirect, setRedirect] = useState('');

    const handleDialogClose = () => {
        window.location.href = redirect;
        setOpenDialog(false);
      };

    const handleOpen = () => {
        setOpenDialog(true);
    };

    React.useEffect(() => {
        if (language) {
          i18n.changeLanguage(language);
        }
      }, [language, i18n]);

    async function changeField(new_data) {
        try {
            const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/modify/${place_id}` , {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify(new_data)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

        } catch (error) {
            console.error('Error fetching modifying state:', error);
        }
    }

    async function newDay(dayData) {
        setItinerary((prev) => ({
            ...prev,
            itinerary: [...prev.itinerary, dayData]
        }));
        try {
            const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itinerariesDays/add/${place_id}` , {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify(dayData)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

        } catch (error) {
            console.error('Error creating new day:', error);
        }
    }

    async function generateItinerary() {
        if (areFieldsFilled()) {
            setloadingOllama(true);
            try {
                const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/personalize/${city}/${country}` , {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({
                        prompt: prompt
                    })
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }

                const data = await response.json();

                if (data && data.data.itinerary) {
                    data.data.itinerary.forEach((dayData) => {
                        newDay({
                            day: dayData.day,
                            description: dayData.description.map(item => ({
                                place: item.place,
                                description: item.description,
                                checked: false,
                                tips: item.tips || ""
                            }))
                        });
                    });
                }

            } catch (error) {
                console.error('Error creating itinerary:', error);
            } finally {
                setloadingOllama(false);
            }
        } else {
            setDialogText(t("Please fill in all fields before generating the itinerary."));
            setRedirect("");
            handleOpen();
        }

    }

    useEffect(() => {
        const fetchItinerary = async () => {
          try {
            const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/get/${place_id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            });

            if (response.status === 401){
                setDialogText(t("Unauthorized, please login."));
                setRedirect(`/GlobeTrek/${language}/login`);
                handleOpen();
                return;
            }

            if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            data.itinerary = data.itinerary || [];
            setItinerary(data);
            setSelectedState(data.state)
            
            if (data.city !== "Undefined" && data.city !== "Indefinido"){
                setCity(data.city)
            }
            if (data.country !== "Undefined" && data.country !== "Indefinido"){
                setCountry(data.country)
            }

          } catch (error) {
            return;
          } finally {
            setLoading(false);
          }
        };

        if (!fetchedRef.current) {
            fetchItinerary();
            fetchedRef.current = true;
        }
      }, [place_id]);

      const areFieldsFilled = () => {
        return (city && city.trim() !== '') &&
               (country && country.trim() !== '') &&
               (prompt && prompt.trim() !== '');
        };
    

    const states = ['Planning', 'Planned', 'Done'];
    return (
        <Box sx={{ display: 'flex' }}>            
            <CssBaseline />
            {loading ? (
                    <Box 
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        width: '100%'
                    }}
                >
                    <React.Fragment>
                    <svg width={0} height={0}>
                        <defs>
                        <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#e01cd5" />
                            <stop offset="100%" stopColor="#1CB5E0" />
                        </linearGradient>
                        </defs>
                    </svg>
                    <CircularProgress sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }} />
                    </React.Fragment>
                </Box>
                ) : (
                itinerary && (
                <Box component="main" sx={{ flexGrow: 1, p: 3, marginLeft: "7vw", marginTop: '10vh' }}>
                <GTAppBar user_id={itinerary.owner} withMenu={true}/>
                <Box sx={{ textAlign: "right" }}>
                    <Button 
                    variant="contained" 
                    sx={{backgroundColor: "#f47053"}}
                    onClick={async ()=>{
                        try {
                            const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/delete/${place_id}` , {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                                }
                            });
                            if (!response.ok) {
                                throw new Error('Network response was not ok ' + response.statusText);
                            }

                            setDialogText(t("Itinerary removed"));
                            setRedirect(`/GlobeTrek/${language}/home/${itinerary.owner}`);
                            handleOpen();
                
                        } catch (error) {

                        }
                    }}
                    >{t('Remove')}</Button>
                </Box>

                <div>
                <TextField
                    variant="standard"
                    defaultValue={itinerary.destination}
                    onChange={(event) => changeField({"destination": event.target.value})}
                    inputProps={{style: {fontSize: 40}}}
                />
                </div>
                
                <Rating name="size-large" defaultValue={itinerary.stars} onChange={(event, newValue) => changeField({"stars":newValue})}/>

                <Box>
                    <StyledSelect
                        value={selectedState}
                        onChange={(e) =>{ 
                            const newState = e.target.value;
                            setSelectedState(newState);
                            changeField({"state": newState});
                            }
                        }
                        displayEmpty
                    >
                        {states.map((state) => (
                            <MenuItem key={state} value={state}>
                                {state}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                </Box>
                <Box>
                    <TextField
                        id="city_textfield"
                        label="City"
                        maxRows={4}
                        variant="standard"
                        value={city}
                        onChange={(e) => {
                            setCity(e.target.value)
                            changeField({"city": e.target.value})
                        }}
                        sx={{ width: '13vw' }}
                    />
                    <TextField
                        id="country_textfield"
                        label="Country"
                        maxRows={4}
                        variant="standard"
                        value={country}
                        onChange={(e) => {
                            setCountry(e.target.value)
                            changeField({"country": e.target.value})
                        }}
                        sx={{ marginLeft: '5vw', width: '13vw' }}
                    />
                </Box>
                <Box>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <StyledDatePicker label="Start date" format="DD/MM/YYYY" value={dayjs(itinerary.startDate)} onChange={(newDate) => changeField({"startDate":newDate})} />
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <StyledDatePicker label="End date" format="DD/MM/YYYY" value={dayjs(itinerary.endDate)} onChange={(newDate) => changeField({"endDate":newDate})} />
                    </LocalizationProvider>
                    <TextField
                        id="standard-multiline-flexible"
                        label={t("Plan your perfect trip by describing it here...")}
                        multiline
                        maxRows={4}
                        variant="standard"
                        onChange={(e) => setPrompt(e.target.value)}
                        sx={{ marginLeft: '20vw', width: '40vw' }}
                    />
                    <Button sx={{ backgroundColor: '#929cf9', color: '#ffffff'}} onClick={generateItinerary} disabled={!areFieldsFilled()}>{loadingOllama ? <CircularProgress size={24} color="inherit" /> : t('Generate')}</Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h4" noWrap component="div" >
                        {t('Itinerary')}
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        {itinerary.itinerary.map((day, index) => (
                            <Grid item xs={12} sm={6} md={4} key={day.day}>
                                <Card sx={{ minWidth: 280, borderRadius: 5, boxShadow: 3 }}>
                                    <CardContent sx={{ textAlign: 'left' }}>
                                        <Box sx={{ textAlign:"right" }}>
                                            <HighlightOffIcon style={{ color: 'red' }} onClick={async () => {
                                                    setItinerary(prev => {
                                                        const updatedItinerary = { ...prev };
                                                        updatedItinerary.itinerary.splice(index, 1);
                                                        return updatedItinerary;
                                                    });
                                                    try {
                                                        const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itinerariesDays/delete/${place_id}/days/${index}` , {
                                                            method: 'DELETE',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                                                            }
                                                        });
                                                        if (!response.ok) {
                                                            throw new Error('Network response was not ok ' + response.statusText);
                                                        }
                                            
                                                    } catch (error) {
                                                        console.error('Error fetching modifying state:', error);
                                                    }

                                                }}/>
                                        </Box>
                                        <TextField
                                            variant="filled"
                                            defaultValue={day.day}
                                            sx={{
                                                textAlign: 'center',
                                                width: '100%',
                                                mb: 2,
                                                fontWeight: 'bold',
                                                "& .MuiFilledInput-root": {
                                                    backgroundColor: 'transparent',
                                                    fontSize: '1.5rem',
                                                    fontWeight: 'bold',
                                                    padding: 0,
                                                    borderBottom: 'none',
                                                },
                                            }}
                                            InputProps={{
                                                disableUnderline: true,
                                            }}
                                            onChange={async (e) => {
                                                const field = `itinerary.${index}.day`
                                                changeField({ [field]: e.target.value })
                                            }}
                                        />
                                        <Box>
                                            {day.description.map((place, idx) => (
                                                <Box sx={{ display: 'flex', alignItems: 'start', mb: 1.5 }} key={idx}>
                                                    <Checkbox
                                                        checked={place.checked}
                                                        sx={{ alignSelf: 'start', mt: 0.5 }}
                                                        onChange={() => {
                                                            const newData = {
                                                                [`itinerary.${index}.description.${idx}.checked`]: (!place.checked).toString()
                                                            };
                                                            changeField(newData);
                                                            const updatedItinerary = { ...itinerary };
                                                            updatedItinerary.itinerary[index].description[idx].checked = !place.checked;
                                                            setItinerary(updatedItinerary);
                                                        }}
                                                    />
                                                    <Box sx={{ ml: 1, width: '100%' }}>
                                                        <TextField
                                                            variant="filled"
                                                            defaultValue={place.place}
                                                            fullWidth
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                "& .MuiFilledInput-root": {
                                                                    backgroundColor: 'transparent',
                                                                    fontSize: '1.1rem',
                                                                    padding: 0,
                                                                    borderBottom: 'none',
                                                                },
                                                            }}
                                                            InputProps={{
                                                                disableUnderline: true,
                                                            }}
                                                            onChange={async (e) => {
                                                                const field = `itinerary.${index}.description.${idx}.place`
                                                                changeField({ [field]: e.target.value })
                                                            }}
                                                        />
                                                        <TextField
                                                            variant="filled"
                                                            defaultValue={place.description + (place.tips ? '\nTips: ' + place.tips : '')}
                                                            multiline
                                                            fullWidth
                                                            sx={{
                                                                mt: 0.5,
                                                                "& .MuiFilledInput-root": {
                                                                    backgroundColor: 'transparent',
                                                                    fontSize: '1rem',
                                                                    color: 'text.secondary',
                                                                    padding: 0,
                                                                    borderBottom: 'none',
                                                                },
                                                            }}
                                                            InputProps={{
                                                                disableUnderline: true,
                                                            }}
                                                            onChange={async (e) => {
                                                                const field = `itinerary.${index}.description.${idx}.description`
                                                                changeField({ [field]: e.target.value })
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                        <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mt: 2,
                                            width: '100%',
                                        }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    mt: 2,
                                                    cursor: 'pointer',
                                                    color: 'primary.main',
                                                }}
                                                onClick={async () => {
                                                    const newPlace = { place: '', description: '', checked: false };
                                                    setItinerary((prev) => {
                                                        const updatedItinerary = { ...prev };
                                                        updatedItinerary.itinerary[index].description.push(newPlace);
                                                        return updatedItinerary;
                                                    });
                                                }}
                                            >
                                                <AddIcon sx={{ fontSize: '1.5rem' }} />
                                                <Box sx={{ ml: 1, fontSize: '0.9rem', fontWeight: 'bold' }}>{t('Add place')}</Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                        <Grid item xs={12} sm={6} md={4}>
                            <Card
                                sx={{
                                    minWidth: 280,
                                    minHeight: 200,
                                    borderRadius: 5,
                                    boxShadow: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                    }
                                }}
                                onClick={() => newDay({
                                    day: `Day ${itinerary.itinerary.length + 1}`,
                                    description: [
                                        { place: 'Place', description: 'Description', checked: false }
                                    ]
                                })}
                            >
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <AddIcon sx={{ fontSize: '3rem', color: 'text.secondary' }} />
                                    <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'text.secondary' }}>
                                        {t('Add day')}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
            )
        )}
        <Dialog open={openDialog} onClose={handleDialogClose}>
            <DialogTitle>{dialogText}</DialogTitle>
            <DialogActions>
            <Button onClick={handleDialogClose}>Close</Button>
            </DialogActions>
        </Dialog>
    </Box>
    );
}

export default Place;