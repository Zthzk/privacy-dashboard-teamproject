import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

import MobileSection from './MobileSection';
import Notification from './Notification';
import Profile from './Profile';

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <>
      <Box sx={{ flexGrow: 1, ml: 1 }} />
      <Notification />
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
