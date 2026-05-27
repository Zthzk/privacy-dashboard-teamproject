import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import LogoIcon from './LogoIcon';

export default function LogoMain() {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Stack sx={{ width: 32, height: 32, flexShrink: 0, '& svg': { width: '100%', height: '100%' } }}>
        <LogoIcon />
      </Stack>
      <Stack sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            color: theme.vars.palette.text.primary,
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Privacy Dashboard
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          for ML Pipelines
        </Typography>
      </Stack>
    </Stack>
  );
}
