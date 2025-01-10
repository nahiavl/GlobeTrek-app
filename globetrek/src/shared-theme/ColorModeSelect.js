import React from 'react';
import { Switch } from '@mui/material';

const ColorModeSelect = ({ toggleColorMode }) => {
  return (
    <Switch
      onChange={toggleColorMode}
      color="default"
      inputProps={{ 'aria-label': 'theme switch' }}
    />
  );
};

export default ColorModeSelect;