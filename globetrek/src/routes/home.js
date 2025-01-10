import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { Avatar, Button, Dialog, DialogActions, DialogTitle, Pagination } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import SwipeableViews from 'react-swipeable-views';
import WorldMap from '../components/WorldMap'
import VisitedCountriesChart from '../components/VisitedCountries'
import { useNavigate, useParams } from 'react-router-dom';
import { findFlagUrlByCountryName } from "country-flags-svg";
import { GTAppBar } from 'src/components/AppBar';
import { useTranslation } from 'react-i18next';

function Element() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingItinerary, setLoadingItinerary] = useState(true);
  const { user_id } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [countriesArray, setCountriesArray] = useState([]);
  const [itinerariesNames, setItinerariesNames] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const containerRef = useRef(null);
  const fetchedRef = useRef(false);
  const { t, i18n } = useTranslation();
  const { language: paramLanguage = 'en' } = useParams();
  const language = localStorage.getItem("language") || paramLanguage || 'en';

  const handleDialogClose = () => {
    setOpenDialog(false);
    window.location.href = `/GlobeTrek/${language}/login`;
  };

  React.useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!user_id){
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const id = params.get('id');
        localStorage.setItem("access_token", token);
        const redirectLanguage = localStorage.getItem("language") || 'en';
        window.location.href = `/GlobeTrek/${redirectLanguage}/home/${id}`;
      }

      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/user/${user_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.status === 401 || !response.ok){
          setOpenDialog(true);
          return;
        }
        
        const data = await response.json();
        setUser(data);

        if (data.countries) {
          const parsedCountries = data.countries.replace(/"/g, '').replace(/{|}/g, '').split(',').map((country) => country.trim());
          setCountriesArray(parsedCountries);
        }

        fetchItineraries();

      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchItineraries = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/byUser/${user_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error('Error: ' + response.statusText);
        }
        const data = await response.json();

        const itineraries = data.itineraries.map((itinerary) => ({
          name: itinerary.destination,
          id: itinerary._id,
          flag: findFlagUrlByCountryName(itinerary.country) || "https://as2.ftcdn.net/v2/jpg/04/49/40/35/1000_F_449403530_UuZ4woGFRjSwInWAGNBIFyzOGafRCgXW.jpg"
        }));
        setItinerariesNames(itineraries);
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      } finally {
        setLoadingItinerary(false);
      }
    };

    if (!fetchedRef.current) {
      fetchUser();
      fetchedRef.current = true;
    }
  }, [user_id]);

  const navigate = useNavigate();

  const calculateItemsPerPage = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const itemWidth = 120;
      const newItemsPerPage = Math.floor(containerWidth / itemWidth);
      setItemsPerPage(newItemsPerPage > 0 ? newItemsPerPage : 1);
    }
  };

  useEffect(() => {
    const savedIndex = localStorage.getItem('currentIndex');
    if (savedIndex) {
      setCurrentIndex(Number(savedIndex));
    }

    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
      setItemsPerPage(Number(savedItemsPerPage));
    }

    window.addEventListener('resize', calculateItemsPerPage);
    calculateItemsPerPage();

    return () => {
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('currentIndex', currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem('itemsPerPage', itemsPerPage);
  }, [currentIndex, itemsPerPage]);

  const totalCountriesToShow = 10;

  const totalPages = Math.ceil(itinerariesNames.length / itemsPerPage);

  const handleChangeIndex = (index) => {
    setCurrentIndex(index);
  };

  const handlePageChange = (event, value) => {
    setCurrentIndex(value - 1);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '8vw'
      }}
    >
      <GTAppBar user_id={user_id} withMenu={true} />
      <CssBaseline />
  
      {loadingUser ? (
        <Typography
          variant="h6"
          sx={{marginTop: '10vh' }}
        >
          {t('Loading user...')}
        </Typography>
      ) : (
        user && (
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ marginTop: '10vh' }}
            >
              {t('Welcome')}, {user.name}!
            </Typography>
          </Box>
        )
      )}

      <Typography
        variant="h5"
        noWrap
        component="div"
        sx={{
          paddingBottom: '1vw',
        }}
      >
        {t('Your itineraries')}
      </Typography>
  
  
      {loadingItinerary ? (
        <Typography variant="h6">
          {t('Loading itineraries...')}
        </Typography>
      ) : (
        itinerariesNames && (
          <Box
            ref={containerRef}
            sx={{
              padding: '20px',
              marginTop: '2vw',
            }}
          >
            
            {itinerariesNames.length !== 0 ? (
              <>
                <SwipeableViews
                  index={currentIndex}
                  onChangeIndex={handleChangeIndex}
                  enableMouseEvents
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: totalPages }).map((_, pageIndex) => (
                    <Box
                      key={pageIndex}
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {itinerariesNames
                        .slice(
                          pageIndex * itemsPerPage,
                          (pageIndex + 1) * itemsPerPage
                        )
                        .map((country) => (
                          <Box
                            key={country.id}
                            onClick={() => {
                              navigate(
                                `/GlobeTrek/${language}/place/${country.id}`
                              );
                            }}
                            sx={{
                              textAlign: 'center',
                              cursor: 'pointer',
                              margin: '10px',
                            }}
                          >
                            <img
                              src={country.flag}
                              alt={`${country.country} flag`}
                              style={{
                                width: '9vw',
                                height: '9vw',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                            <Typography>{country.name}</Typography>
                          </Box>
                        ))}
                    </Box>
                  ))}
                </SwipeableViews>
                <Pagination
                  count={totalPages}
                  page={currentIndex + 1}
                  onChange={handlePageChange}
                  sx={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#d4d8fe',
                    width: '9vw',
                    height: '9vw',
                    margin: '0 auto',
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `${process.env.REACT_APP_GATEWAY_URL}/itineraries/create`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem(
                              'access_token'
                            )}`,
                          },
                          body: JSON.stringify({
                            destination: t('Destination'),
                            owner: user_id,
                            state: 'Planning',
                            country: t('Undefined'),
                            city: t('Undefined'),
                            itinerary: [
                              {
                                day: `${t('Day')} 1`,
                                description: [
                                  {
                                    place: t('Place'),
                                    description: t('Description'),
                                    checked: 'false',
                                  },
                                ],
                              },
                            ],
                          }),
                        }
                      );
                      if (!response.ok) {
                        throw new Error(
                          'Network response was not ok ' +
                            response.statusText
                        );
                      }
                      const data = await response.json();
                      navigate(`/GlobeTrek/${language}/place/${data._id}`);
                    } catch (error) {
                      console.error(
                        'Error creating itinerary:',
                        error
                      );
                    }
                  }}
                >
                  <AddIcon sx={{ color: 'white', fontSize: '6vw' }} />
                </Avatar>
                <Typography variant="h6" sx={{ marginTop: 2 }}>
                  {t('New itinerary')}
                </Typography>
              </Box>
            )}
          </Box>
        )
      )}
  
      <Typography
        variant="h5"
        noWrap
        component="div"
        sx={{
          paddingBottom: '1vw',
        }}
      >
        {t('Visited countries')}
      </Typography>
  
      {loadingUser ? (
        <Typography variant="h6">
          {t('Loading map...')}
        </Typography>
      ) : (
        countriesArray && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginTop: 2,
              padding: '20px',
            }}
          >
            <WorldMap countriesToColor={countriesArray} />
            <VisitedCountriesChart countries={countriesArray} />
          </Box>
        )
      )}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{t("Unauthorized, please login.")}</DialogTitle>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}  

export default Element;
