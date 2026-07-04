import { useColorScheme } from '@mui/material/styles';
import IconButton from 'components/@extended/IconButton';
import MoonOutlined from '@ant-design/icons/MoonOutlined';
import SunOutlined from '@ant-design/icons/SunOutlined';

// ==============================|| THEME TOGGLE ||============================== //
export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null;

  return (
    <IconButton
      aria-label="toggle theme"
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      color="secondary"
      variant="light"
      sx={{ color: 'text.primary' }}
    >
      {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
    </IconButton>
  );
}