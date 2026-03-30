import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useBreakpointDown } from '@/hooks/useResponsive';

/**
 * ResponsiveDataView — renders children (Table) on desktop.
 * On mobile, maps `rows` to Card-based list using `renderCard`.
 *
 * Accessibility:
 * - Mobile card list uses role="list" + role="listitem" for proper AT semantics
 * - Empty state announced via role="status" + aria-live
 *
 * @param {ReactNode}  children       - the desktop Table/TableContainer
 * @param {Array}      rows           - data array for mobile cards
 * @param {Function}   renderCard     - (row, index) => ReactNode
 * @param {string}     [emptyMessage] - shown when rows is empty
 * @param {string}     [listLabel]    - accessible label for the mobile list
 */
export default function ResponsiveDataView({
  children,
  rows = [],
  renderCard,
  emptyMessage = 'No data found.',
  listLabel = 'Data list',
}) {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');

  if (!isMobile) return children;

  if (rows.length === 0) {
    return (
      <Box role="status" aria-live="polite" sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} role="list" aria-label={listLabel}>
      {rows.map((row, index) => (
        <Card
          key={row.id || row._id || index}
          variant="outlined"
          sx={{ borderRadius: 2 }}
          role="listitem"
        >
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            {renderCard(row, index)}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
