// third-party
import { presetPalettes } from '@ant-design/colors';

// project imports
import ThemeOption from './theme';
import { extendPaletteWithChannels } from 'utils/colorUtils';

const greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];

// ==============================|| GREY COLORS BUILDER ||============================== //

function buildGrey() {
  let greyPrimary = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
  ];
  let greyConstant = ['#fafafb', '#e6ebf1'];

  return [...greyPrimary, ...greyAscent, ...greyConstant];
}

//dark mode
function buildGreyDark() {
  let greyPrimary = [
    '#141414', '#1d1d1d', '#262626', '#303030', '#434343',
    '#595959', '#8c8c8c', '#bfbfbf', '#d9d9d9', '#f0f0f0', '#ffffff'
  ];
  let greyConstant = ['#1d1d1f', '#2a2f38'];
  return [...greyPrimary, ...greyAscent.slice().reverse(), ...greyConstant];
}

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export function buildPalette(presetColor) {
  const lightColors = { ...presetPalettes, grey: buildGrey() };
  const darkColors = { ...presetPalettes, grey: buildGreyDark() };

  const lightPaletteColor = ThemeOption(lightColors, presetColor);
  const darkPaletteColor = ThemeOption(darkColors, presetColor);

  const commonColor = { common: { black: '#000', white: '#fff' } };

  const extendedLight = extendPaletteWithChannels(lightPaletteColor);
  const extendedDark = extendPaletteWithChannels(darkPaletteColor);
  const extendedCommon = extendPaletteWithChannels(commonColor);

  return {
    light: {
      mode: 'light',
      ...extendedCommon,
      ...extendedLight,
      text: {
        primary: extendedLight.grey[700],
        secondary: extendedLight.grey[500],
        disabled: extendedLight.grey[400]
      },
      action: { disabled: extendedLight.grey[300] },
      divider: extendedLight.grey[200],
      background: {
        paper: extendedLight.grey[0],
        default: extendedLight.grey.A50
      }
    },
    dark: {
      mode: 'dark',
      ...extendedCommon,
      ...extendedDark,
      text: {
        primary: extendedDark.grey[700],
        secondary: extendedDark.grey[500],
        disabled: extendedDark.grey[400]
      },
      action: { disabled: extendedDark.grey[300] },
      divider: extendedDark.grey[200],
      background: {
        paper: extendedDark.grey[0],   
        default: extendedDark.grey.A50
      }
    }
  };
}
