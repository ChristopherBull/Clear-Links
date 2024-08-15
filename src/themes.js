const fontFamilySanSerif = 'sans-serif';

export const themes = {
  light: { // 1 (default)
    div: {
      'background': '#ffffff',
      'border': '1px solid #A2A0A0',
      'border-radius': '3px',
      'border-color': '#A2A0A0',
    },
    p: {
      'color': '#dddddd',
      'font-family': fontFamilySanSerif,
      'font-size': 'small',
    },
    spanDomain: {
      color: '#808080',
    },
    spanMailto: {
      color: '#808080',
    },
    icon: {
      background: '#808080',
    },
  },
  dark: { // 2
    div: {
      'background': '#000000',
      'border': '1px solid #aaaaaa',
      'border-radius': '3px',
      'border-color': '#cccccc',
    },
    p: {
      'color': '#666666',
      'font-family': fontFamilySanSerif,
      'font-size': 'small',
    },
    spanDomain: {
      color: '#bbbbbb',
    },
    spanMailto: {
      color: '#bbbbbb',
    },
    icon: {
      background: '#f5f5f5',
    },
  },
  original: { // 3
    div: {
      'background': '#294F6D',
      'border': '1px solid #5F7F99',
      'border-radius': '3px',
      'border-color': '#5F7F99',
    },
    p: {
      'color': '#888888',
      'font-family': fontFamilySanSerif,
      'font-size': 'small',
    },
    spanDomain: {
      color: '#BBCCD9',
    },
    spanMailto: {
      color: '#BBCCD9',
    },
    icon: {
      background: '#D3D3D3',
    },
  },
};
