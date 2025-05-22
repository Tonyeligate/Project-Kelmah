import { Typography, Box } from "@mui/material";
import DashboardLayout from "./layout/DashboardLayout";
import Learning from "./Learning"; // Ensure this path is correct

function Learn() {
    return (
        <DashboardLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4">Learning Component</Typography>
                <Learning /> {/* Using the Learning component */}
            </Box>
        </DashboardLayout>
    );
}

export default Learn; 