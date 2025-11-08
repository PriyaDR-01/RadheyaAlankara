import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TablePagination,
  InputAdornment,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  LocalShipping,
  Inventory,
  CheckCircle,
  Schedule,
  Close,
  Search,
  FilterList,
  Delete,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered';
  orderStatus?: string;
  trackingNumber?: string;
  createdAt: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
}

const orderStatuses = [
  { value: 'pending', label: 'Pending', icon: Schedule, color: 'warning' },
  { value: 'processing', label: 'Processing', icon: Inventory, color: 'info' },
  { value: 'shipped', label: 'Shipped', icon: LocalShipping, color: 'secondary' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'success' },
] as const;

export function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders', {
        headers: {
          'x-admin-token': 'admin-access',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, tracking?: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-access',
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: tracking,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Order status updated successfully.',
        });
        fetchOrders();
        setSelectedOrder(null);
        setStatusUpdate('');
        setTrackingNumber('');
        setIsDialogOpen(false);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        (order.status || order.orderStatus) === statusFilter
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(order => 
          new Date(order.createdAt) >= filterDate
        );
      }
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredOrders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  const getStatusBadge = (status: string) => {
    const statusInfo = orderStatuses.find(s => s.value === status);
    if (!statusInfo) return null;

    const IconComponent = statusInfo.icon;
    return (
      <Chip
        icon={<IconComponent />}
        label={statusInfo.label}
        color={statusInfo.color as any}
        variant="outlined"
        size="small"
      />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusUpdate(order.status || order.orderStatus || 'pending');
    setTrackingNumber(order.trackingNumber || '');
    setIsDialogOpen(true);
  };

  const handleDeleteOrder = async (order: Order) => {
    const confirmMessage = `Are you sure you want to delete order #${order.id.slice(-6)}?\n\nCustomer: ${order.customerName}\nTotal: ${formatCurrency(order.total)}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': 'admin-access',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: `Order #${order.id.slice(-6)} has been deleted successfully.`,
        });
        fetchOrders(); // Refresh the orders list
        
        // Invalidate orders queries to refresh all components
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading orders...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3 
      }}>
        <Typography variant="h5" component="h3">
          Order Management
        </Typography>
        <Chip
          label={`${filteredOrders.length} of ${orders.length} Orders`}
          variant="outlined"
          color="primary"
        />
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2, 
          alignItems: 'center' 
        }}>
          <Box sx={{ flex: { xs: 1, md: 2 } }}>
            <TextField
              fullWidth
              placeholder="Search by customer name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '150px' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {orderStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '150px' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: { xs: '100%', md: '150px' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell><Typography variant="subtitle2">Order ID</Typography></TableCell>
              {!isMobile && <TableCell><Typography variant="subtitle2">Customer</Typography></TableCell>}
              <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Total</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
              {!isMobile && <TableCell><Typography variant="subtitle2">Tracking</Typography></TableCell>}
              <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredOrders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{order.id.slice(-6)}
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {order.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customerEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.total)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status || order.orderStatus || 'pending')}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {order.trackingNumber ? (
                        <Chip
                          label={order.trackingNumber}
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewOrder(order)}
                        sx={{ minWidth: 'auto', padding: '8px' }}
                        title="View Order"
                      >
                        <Visibility />
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteOrder(order)}
                        sx={{ minWidth: 'auto', padding: '8px' }}
                        title="Delete Order"
                      >
                        <Delete />
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            maxHeight: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">
            Order Details #{selectedOrder?.id.slice(-6)}
          </Typography>
          <IconButton
            onClick={() => setIsDialogOpen(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Customer Information */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {selectedOrder.customerName}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          <strong>Phone:</strong> {selectedOrder.customerPhone}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedOrder.customerEmail}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        <strong>Address:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, ml: 1 }}>
                        {selectedOrder.shippingAddress.street}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}<br />
                        {selectedOrder.shippingAddress.pincode}, {selectedOrder.shippingAddress.country}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Order Items
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                          <Typography variant="body1" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                    <Divider />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: 'primary.50'
                    }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatCurrency(selectedOrder.total)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Update */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Update Order Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusUpdate}
                          label="Status"
                          onChange={(e) => setStatusUpdate(e.target.value)}
                        >
                          {orderStatuses.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <status.icon fontSize="small" />
                                {status.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        label="Tracking Number (Optional)"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setIsDialogOpen(false)}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedOrder) {
                updateOrderStatus(selectedOrder.id, statusUpdate, trackingNumber);
              }
            }}
            disabled={!statusUpdate}
            fullWidth={isMobile}
          >
            Update Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
