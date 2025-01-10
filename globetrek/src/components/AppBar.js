import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DrawIcon from '@mui/icons-material/Draw';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import GlobeTrekLogo from './GlobeTrek_logo.png'
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
  '&:focus': {
    backgroundColor: 'transparent',
  },
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

export const GTAppBar = ({ user_id = "", withMenu=true }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElLanguage, setAnchorElLanguage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [unauthorizedDialog, setUnauthorizedDialog] = useState(false);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState(false);
  const [confirmItinerariesRemoveDialog, setConfirmItinerariesRemoveDialog] = useState(false);

  const { t, i18n } = useTranslation();
  const isMenuOpen = Boolean(anchorEl);
  const { language = 'en' } = useParams();

  const handleDrawerOpen = () => setOpenDrawer(true);
  const handleDrawerClose = () => setOpenDrawer(false);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleDialogClose = () => setOpenDialog(false);
  const handleUnauthorizedDialogClose = () => {
    setUnauthorizedDialog(false) 
    window.location.href = `/GlobeTrek/${language}/login`;};
  const handleConfirmRemoveDialogClose = () => setConfirmRemoveDialog(false);
  const handleConfirmItinerariesRemoveDialogClose = () => {
    setConfirmItinerariesRemoveDialog(false)
    window.location.href = `/GlobeTrek/${language}/login`;
  };

  const handleLanguageMenuClick = (event) => {
    setAnchorElLanguage(event.currentTarget);
  };

  const handleLanguageChange = (language) => {
    localStorage.setItem("language", language);
    i18n.changeLanguage(language);
    setAnchorElLanguage(null);
    const currentPath = window.location.pathname.split('/').slice(3).join('/');
    navigate(`/GlobeTrek/${language}/${currentPath}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate(`/GlobeTrek/${language}/login`);
  };

  const handleChangePassword = () => {
    navigate(`/GlobeTrek/${language}/new_password/${user_id}`);
  };

  const handleRemoveAccount = () => setOpenDialog(true);

  const removeUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/user/${user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.ok) {
        setConfirmRemoveDialog(true);
      } else {
        setUnauthorizedDialog(true);
      }

    } catch (error) {
      
    }
  };

  const removeUserItineraries = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/deleteByOwner/${user_id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
         },
      });
      if (response.ok) setConfirmItinerariesRemoveDialog(true);
    } catch (error) {
      console.error('Error deleting user itineraries:', error);
    }
  };

  const handleAccountDeletion = async () => {
    handleDialogClose();
    await removeUser();
    await removeUserItineraries();
  };

  React.useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <Box>
      <AppBar position="fixed" open={openDrawer}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ marginRight: 5, ...(openDrawer && { display: 'none' }) }}
          >
          {withMenu && (
            <MenuIcon sx={{ color: '#626c75' }} />
          )}
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={GlobeTrekLogo} alt="GlobeTrek Logo" onClick={() => {navigate(`/GlobeTrek/${language}/home/${user_id}`)}}/>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton color="inherit" onClick={handleLanguageMenuClick}>
                <LanguageIcon sx={{ 'color': 'grey' }} />
              </IconButton>
              <Menu
                anchorEl={anchorElLanguage}
                open={Boolean(anchorElLanguage)}
                onClose={() => setAnchorElLanguage(null)}
              >
                <MenuItem onClick={() => handleLanguageChange('en')}>en</MenuItem>
                <MenuItem onClick={() => handleLanguageChange('es')}>es</MenuItem>
                <MenuItem onClick={() => handleLanguageChange('eu')}>eu</MenuItem>
                <MenuItem onClick={() => handleLanguageChange('gal')}>gal</MenuItem>
              </Menu>

              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircle sx={{ fontSize: 40, color: 'gray' }} />
              </IconButton>
              <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
                <CustomMenuItem onClick={handleChangePassword}>{t('Change password')}</CustomMenuItem>
                <CustomMenuItem onClick={handleLogout}>{t('Logout')}</CustomMenuItem>
                <CustomMenuItem onClick={handleRemoveAccount} sx={{ color: "red" }}>{t('Remove account')}</CustomMenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {withMenu && (
        <Drawer
          variant="permanent"
          open={openDrawer}
        >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon sx={{ color: 'black' }} /> : <ChevronLeftIcon sx={{ color: 'black' }} />}
          </IconButton>
        </DrawerHeader>
        <List>
          {[t('New'), t('Planning'), t('Planned'), t('Done')].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: openDrawer ? 'initial' : 'center',
                  px: 2.5,
                  backgroundColor: index === 0 ? '#d4d8fe' : '#e3f2fd',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#bbdefb' },
                }}
                onClick={async () => {
                  if (text === t("New")) {
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
                  } else if (text === t("Planning")) {
                    navigate(`/GlobeTrek/${language}/planning/${user_id}`);
                  } else if (text === t("Planned")) {
                    navigate(`/GlobeTrek/${language}/planned/${user_id}`);
                  } else {
                    navigate(`/GlobeTrek/${language}/done/${user_id}`);
                  }                
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: openDrawer ? 3 : 'auto', justifyContent: 'center' }}>
                {index === 0 && <AddIcon onClick={async () => {
                      try {
                        const response = await fetch(`${process.env.REACT_APP_GATEWAY_URL}/itineraries/create` , {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                        },
                        body: JSON.stringify({
                            destination: "Destination",
                            owner: user_id,
                            state: "Planned",
                            country: "Undefined",
                            itinerary: [{
                              day: "Day 1",
                              description: [{
                                place: "Place",
                                description: "Description",
                                checked: "false"
                              }]
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
                      }} />}
                      {index === 1 && <DrawIcon onClick={() => {
                      navigate(`/GlobeTrek/${language}/planning/${user_id}`)
                      }}/>}
                      {index === 2 && <ChecklistRtlIcon onClick={() => {
                      navigate(`/GlobeTrek/${language}/planned/${user_id}`)
                      }}/>}
                      {index === 3 && <CheckCircleOutlineIcon onClick={() => {
                      navigate(`/GlobeTrek/${language}/done/${user_id}`)
                      }}/>}
                </ListItemIcon>
                <ListItemText primary={text} sx={{ opacity: openDrawer ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      )}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Are you sure you want to remove your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Removing your account will permanently delete your data. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAccountDeletion} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
            
      <Dialog open={confirmRemoveDialog} onClose={handleConfirmRemoveDialogClose}>
        <DialogTitle>Account Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            User removed successfully.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmRemoveDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmItinerariesRemoveDialog} onClose={handleConfirmItinerariesRemoveDialogClose}>
        <DialogTitle>Itineraries Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            User itineraries removed successfully.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmItinerariesRemoveDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={unauthorizedDialog} onClose={handleUnauthorizedDialogClose}>
        <DialogTitle>Unauthorized</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please login.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnauthorizedDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};