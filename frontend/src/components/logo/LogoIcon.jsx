import { useTheme } from '@mui/material/styles';

export default function LogoIcon() {
  const theme = useTheme();

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 4.5L7.5 9.7V18.4C7.5 26.3 12.6 33.35 20 35.5C27.4 33.35 32.5 26.3 32.5 18.4V9.7L20 4.5Z"
        fill={theme.vars.palette.primary.lighter}
        stroke={theme.vars.palette.primary.main}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 18.2H24.5C25.15 18.2 25.7 18.75 25.7 19.4V25.4C25.7 26.05 25.15 26.6 24.5 26.6H15.5C14.85 26.6 14.3 26.05 14.3 25.4V19.4C14.3 18.75 14.85 18.2 15.5 18.2Z"
        fill="white"
        stroke={theme.vars.palette.primary.main}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16.8 18.2V15.9C16.8 14.1 18.2 12.7 20 12.7C21.8 12.7 23.2 14.1 23.2 15.9V18.2"
        stroke={theme.vars.palette.primary.main}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 21.4V23.6"
        stroke={theme.vars.palette.primary.main}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
