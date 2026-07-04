import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

import MobileSection from './MobileSection';
import Notification from './Notification';
import Profile from './Profile';
import ThemeToggle from './ThemeToggle';


export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <>
      <Box sx={{ flexGrow: 1, ml: 1 }} />
      <ThemeToggle />
      <Notification />
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
