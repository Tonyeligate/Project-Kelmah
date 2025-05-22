import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Edit,
    Delete,
    Block,
    CheckCircle,
    Warning
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:3000/api/admin/users`,
                {
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        search: searchQuery
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setUsers(response.data.users);
            setError(null);
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setOpenDialog(true);
    };

    const handleUpdateUser = async () => {
        try {
            await axios.put(
                `http://localhost:3000/api/admin/users/${selectedUser.id}`,
                selectedUser,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setOpenDialog(false);
            fetchUsers();
        } catch (err) {
            setError('Failed to update user');
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(
                    `http://localhost:3000/api/admin/users/${userId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                fetchUsers();
            } catch (err) {
                setError('Failed to delete user');
                console.error(err);
            }
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await axios.patch(
                `http://localhost:3000/api/admin/users/${userId}/status`,
                {
                    status: currentStatus === 'active' ? 'suspended' : 'active'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchUsers();
        } catch (err) {
            setError('Failed to update user status');
            console.error(err);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h5">User Management</Typography>
                <TextField
                    size="small"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 300 }}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Joined</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={user.role}
                                        color={user.role === 'admin' ? 'error' : 'primary'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.status}
                                        color={user.status === 'active' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditUser(user)}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleUserStatus(
                                            user.id,
                                            user.status
                                        )}
                                    >
                                        {user.status === 'active' ? <Block /> : <CheckCircle />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={users.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ pt: 2 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={selectedUser.username}
                                onChange={(e) => setSelectedUser({
                                    ...selectedUser,
                                    username: e.target.value
                                })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                value={selectedUser.email}
                                onChange={(e) => setSelectedUser({
                                    ...selectedUser,
                                    email: e.target.value
                                })}
                                sx={{ mb: 2 }}
                            />
                            {/* Add more fields as needed */}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagement; 