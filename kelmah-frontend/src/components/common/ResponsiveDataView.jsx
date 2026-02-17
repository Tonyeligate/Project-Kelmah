import { Box, Card, CardContent, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

/**
 * ResponsiveDataView — renders children (Table) on desktop.
 * On mobile, maps `rows` to Card-based list using `renderCard`.
 *
 * @param {ReactNode}  children       – the desktop Table/TableContainer
 * @param {Array}      rows           – data array for mobile cards
 * @param {Function}   renderCard     – (row, index) => ReactNode
 * @param {string}     [emptyMessage] – shown when rows is empty
 */
export default function ResponsiveDataView({ children, rows = [], renderCard, emptyMessage = 'No data found.' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return children;

  if (rows.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {rows.map((row, index) => (
        <Card key={row.id || row._id || index} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            {renderCard(row, index)}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
