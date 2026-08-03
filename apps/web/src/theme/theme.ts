import { createTheme } from "@mui/material"

const SYSTEM_FONT_STACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif"
].join(",")

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0C66E4"
    },
    secondary: {
      main: "#6E5DC6"
    },
    background: {
      default: "#F7F8F9"
    },
    divider: "#DFE1E6"
  },
  shape: {
    borderRadius: 6
  },
  typography: {
    fontFamily: SYSTEM_FONT_STACK,
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 600
    },
    subtitle2: {
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: "outlined"
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "#F7F8F9",
          color: "#44546F"
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#F1F2F4"
          }
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8
        }
      }
    }
  }
})
