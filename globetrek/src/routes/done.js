import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { Avatar, Pagination } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import SwipeableViews from 'react-swipeable-views';
import { useNavigate, useParams } from 'react-router-dom';
import { findFlagUrlByCountryName } from "country-flags-svg";
import { GTAppBar } from '../components/AppBar'
import { useTranslation } from 'react-i18next';

function Done() {
  const [loadingItinerary, setLoadingItinerary] = useState(true);
  const { user_id } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [itinerariesNames, setItinerariesNames] = useState([]);
  const { language = 'en' } = useParams();
  const containerRef = useRef(null);
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
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

        const doneItineraries = data.itineraries
          .filter(itinerary => itinerary.state === "Done")
          .map((itinerary) => ({
            name: itinerary.destination,
            id: itinerary._id,
            flag: findFlagUrlByCountryName(itinerary.country) || "https://as2.ftcdn.net/v2/jpg/04/49/40/35/1000_F_449403530_UuZ4woGFRjSwInWAGNBIFyzOGafRCgXW.jpg"
          }));

        setItinerariesNames(doneItineraries);
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      } finally {
        setLoadingItinerary(false);
      }
    };

    fetchItineraries();
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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <GTAppBar user_id={user_id} withMenu={true}/>
        <Typography variant="h5" noWrap component="div" sx={{ marginLeft: '7vw', paddingTop: '1vh', marginTop: '10vh' }}>
          {t('Done')}
        </Typography>
        {loadingItinerary ? (
          <Typography variant="h6" sx={{ marginLeft: '7vw' }}>Loading itineraries...</Typography>
        ) : (
          itinerariesNames && (
            <Box
          ref={containerRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            padding: '20px',
          }}
        >
        {itinerariesNames.length !== 0 ? (
          <SwipeableViews index={currentIndex} onChangeIndex={handleChangeIndex} enableMouseEvents>
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <Box key={pageIndex} sx={{ display: 'flex', justifyContent: 'center' }}>
                {itinerariesNames
                  .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                  .slice(0, totalCountriesToShow)
                  .map((country) => (
                    <Box key={country.id} onClick={() => { navigate(`/GlobeTrek/${language}/place/${country.id}`) }} sx={{ margin: '0 10px', textAlign: 'center' }}>
                      <img src={country.flag} alt={`${country.country} flag`} style={{ width: '9vw', height: '9vw', borderRadius: '50%', objectFit: 'cover' }} />
                      <Typography>{country.name}</Typography>
                    </Box>
                  ))}
              </Box>
            ))}
          </SwipeableViews>) :(
            <Box sx={{ textAlign: 'center', margin: '20px' }}>
            <Avatar sx={{ bgcolor: '#d4d8fe', width: '9vw', height: '9vw', margin: '0 auto' }} onClick={async () =>{
              try {
                const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/create` , {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({
                  destination: t('Destination'),
                    owner: user_id,
                    state: "Done",
                    country: t('Undefined'),
                    city: t('Undefined'),
                    itinerary: [{
                      day: `${t('Day')} 1`,
                      description: [
                        {
                          place: t('Place'),
                          description: t('Description'),
                          checked: 'false',
                        },
                      ],
                    }]
                })
                });
                if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
                }
                const data = await response.json();
                navigate(`/GlobeTrek/${language}/place/${data._id}`)
        
            } catch (error) {
                console.error('Error fetching creating itinerary:', error);
            }
            }}>
            <AddIcon sx={{ color: 'white', fontSize: '6vw' }} />
            </Avatar>
            <Typography variant="h6" sx={{ marginTop: 2 }}>
              {t('New itinerary')}
            </Typography>
          </Box>
          
          )}

          <Pagination count={totalPages} page={currentIndex + 1} onChange={handlePageChange} sx={{ marginTop: 2 }} />
        </Box>
          )
        )}      
    </Box>
  );
}

export default Done;
