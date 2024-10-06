import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#e5c5bd',
      main: '#5e718b',
      dark: '#b4bfc5',
      contrastText: '#fff',
    },
    secondary: {
      light: '#96aa9a',
      main: '#e2a55e',
      dark: '#cf7041',
      contrastText: '#fff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto, sans-serif',
      'Prompt, sans-serif',
    ].join(','),
  },
});

export default theme;