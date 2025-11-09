import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    IconButton,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    InputAdornment,
    Divider,
    TablePagination,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Upload,
    Close,
    Add,
    Edit,
    Delete,
    Search,
    FilterList,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    stock: number;
    isBestSeller: number;
    isNewArrival: number;
    material?: string;
}

export function ProductManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [] as string[],
        stock: '',
        isNewArrival: false,
        isBestSeller: false,
    });
    const [imageUrls, setImageUrls] = useState<string[]>(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [badgeFilter, setBadgeFilter] = useState('all');

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [refreshKey]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast({
                title: 'Warning',
                description: 'Failed to load categories. Using default categories.',
                variant: 'destructive',
            });
            // Fallback to default categories
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`/api/products?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshProducts = () => {
        setRefreshKey(prev => prev + 1);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            images: [],
            stock: '',
            isNewArrival: false,
            isBestSeller: false,
        });
        setImageUrls(['']);
        setSelectedProduct(null);
    };

    // Stable handlers to prevent input focus loss
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, name: e.target.value }));
    }, []);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, price: e.target.value }));
    }, []);

    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, description: e.target.value }));
    }, []);

    const handleStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, stock: e.target.value }));
    }, []);

    const handleCategoryChange = useCallback((e: any) => {
        setFormData(prev => ({ ...prev, category: e.target.value }));
    }, []); 
    
    const handleCheckboxChange = useCallback((field: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    }, []);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/admin/upload-image', {
                method: 'POST',
                headers: {
                    'x-admin-token': 'admin-access',
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();

                // Simply update the image URL at the given index (this adds to existing images)
                updateImageUrl(index, result.url);
                toast({
                    title: 'Success!',
                    description: 'Image uploaded successfully.',
                });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upload image. Please try again.',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const addImageUrl = () => {
        setImageUrls(prev => [...prev, '']);
    };

    const updateImageUrl = useCallback((index: number, url: string) => {
        setImageUrls(prev => {
            const newUrls = [...prev];
            newUrls[index] = url;

            const validUrls = newUrls.filter(url => url.trim() !== '');
            setFormData(prevData => ({ ...prevData, images: validUrls }));

            return newUrls;
        });
    }, []); const removeImageUrl = useCallback((index: number) => {
        setImageUrls(prev => {
            const newUrls = prev.filter((_, i) => i !== index);

            const validUrls = newUrls.filter(url => url.trim() !== '');
            setFormData(prevData => ({ ...prevData, images: validUrls }));

            return newUrls;
        });
    }, []);

    const openEditDialog = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            category: product.category,
            images: product.images || [],
            stock: product.stock?.toString() || '0',
            isNewArrival: product.isNewArrival === 1,
            isBestSeller: product.isBestSeller === 1,
        });
        setImageUrls(product.images && product.images.length > 0 ? product.images : ['']);
        setIsEditDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent, isEdit = false) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                images: formData.images,
                isNewArrival: formData.isNewArrival ? 1 : 0,
                isBestSeller: formData.isBestSeller ? 1 : 0,
            };

            const url = isEdit && selectedProduct
                ? `/api/admin/products/${selectedProduct.id}`
                : '/api/admin/products';

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': 'admin-access',
                },
                body: JSON.stringify(productData),
            });

            if (response.ok) {
                toast({
                    title: 'Success!',
                    description: `Product has been ${isEdit ? 'updated' : 'added'} successfully.`,
                });
                resetForm();
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                refreshProducts();
                
                // Invalidate product queries to refresh all components
                queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                queryClient.invalidateQueries({ queryKey: ['/api/products/category'] });
                queryClient.invalidateQueries({ queryKey: ['/api/products/best-sellers'] });
            } else {
                throw new Error(`Failed to ${isEdit ? 'update' : 'add'} product`);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: `Failed to ${isEdit ? 'update' : 'add'} product. Please try again.`,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (productId: string, productName: string) => {
        const product = products.find(p => p.id === productId);
        const imageCount = product?.images?.length || 0;
        
        const confirmMessage = imageCount > 0 
            ? `Are you sure you want to delete "${productName}"? This will also permanently delete ${imageCount} associated image(s). This action cannot be undone.`
            : `Are you sure you want to delete "${productName}"? This action cannot be undone.`;
            
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-token': 'admin-access',
                },
            });

            if (response.ok) {
                const successMessage = imageCount > 0 
                    ? `Product and ${imageCount} associated image(s) have been deleted successfully.`
                    : 'Product has been deleted successfully.';
                    
                toast({
                    title: 'Success!',
                    description: successMessage,
                });
                refreshProducts();
                
                // Invalidate product queries to refresh all components
                queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                queryClient.invalidateQueries({ queryKey: ['/api/products/category'] });
                queryClient.invalidateQueries({ queryKey: ['/api/products/best-sellers'] });
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete product. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const formatCurrency = (price: string | number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(parseFloat(price.toString()));
    };

    // Filter and search logic
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(product => {
                const category = categories.find(c => c.slug === product.category);
                return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (category?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
            });
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }

        // Badge filter
        if (badgeFilter !== 'all') {
            if (badgeFilter === 'bestseller') {
                filtered = filtered.filter(product => product.isBestSeller === 1);
            } else if (badgeFilter === 'newarrival') {
                filtered = filtered.filter(product => product.isNewArrival === 1);
            }
        }

        return filtered;
    }, [products, searchTerm, categoryFilter, badgeFilter]);

    // Pagination logic
    const paginatedProducts = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredProducts, page, rowsPerPage]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading || categoriesLoading) {
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
                    Loading products and categories...
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
                <Box>
                    <Typography variant="h5" component="h3">
                        Product Management
                    </Typography>
                    <Chip
                        label={`${filteredProducts.length} of ${products.length} Products`}
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(true);
                    }}
                >
                    Add Product
                </Button>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    gap: { xs: 1.5, sm: 2 },
                    alignItems: { xs: 'stretch', lg: 'center' }
                }}>
                    <Box sx={{ flex: { xs: 1, lg: 3 } }}>
                        <TextField
                            fullWidth
                            placeholder="Search by product name, description, or category..."
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
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1.5, sm: 2 },
                        flex: { xs: 1, lg: 2 }
                    }}>
                        <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={categoryFilter}
                                    label="Category"
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Categories</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Badges</InputLabel>
                                <Select
                                    value={badgeFilter}
                                    label="Badges"
                                    onChange={(e) => setBadgeFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Products</MenuItem>
                                    <MenuItem value="bestseller">Best Sellers</MenuItem>
                                    <MenuItem value="newarrival">New Arrivals</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ minWidth: { xs: '100%', sm: '100px', lg: '120px' } }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterList />}
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('all');
                                    setBadgeFilter('all');
                                }}
                                size="small"
                            >
                                {isMobile ? 'Clear' : 'Clear Filters'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                            <TableCell sx={{ minWidth: { xs: 200, sm: 250 } }}>
                                <Typography variant="subtitle2">Product</Typography>
                            </TableCell>
                            {!isMobile && (
                                <TableCell sx={{ minWidth: 100 }}>
                                    <Typography variant="subtitle2">Category</Typography>
                                </TableCell>
                            )}
                            <TableCell sx={{ minWidth: 80 }}>
                                <Typography variant="subtitle2">Price</Typography>
                            </TableCell>
                            <TableCell sx={{ minWidth: 80 }}>
                                <Typography variant="subtitle2">Stock</Typography>
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 80, sm: 120 } }}>
                                <Typography variant="subtitle2">Badges</Typography>
                            </TableCell>
                            {!isMobile && (
                                <TableCell sx={{ minWidth: 80 }}>
                                    <Typography variant="subtitle2">Images</Typography>
                                </TableCell>
                            )}
                            <TableCell sx={{ minWidth: { xs: 80, sm: 120 } }}>
                                <Typography variant="subtitle2">Actions</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 5 : 7} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {filteredProducts.length === 0 ? 'No products match your filters' : 'No products found'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProducts.map((product) => (
                                <TableRow key={product.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" component="p">
                                                {product.name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {product.description}
                                            </Typography>
                                            {isMobile && (
                                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    <Chip
                                                        label={product.category}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                    <Chip
                                                        label={`${product.images?.length || 0} img`}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    {!isMobile && (
                                        <TableCell>
                                            <Chip
                                                label={categories.find(c => c.slug === product.category)?.name || product.category}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatCurrency(product.price)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="medium"
                                                color={product.stock === 0 ? 'error.main' : product.stock < 5 ? 'warning.main' : 'text.primary'}
                                            >
                                                {product.stock || 0}
                                            </Typography>
                                            {product.stock === 0 && (
                                                <Chip label="OUT OF STOCK" size="small" color="error" />
                                            )}
                                            {product.stock > 0 && product.stock < 5 && (
                                                <Chip label="LOW STOCK" size="small" color="warning" />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {product.isNewArrival === 1 && (
                                                <Chip label="NEW" size="small" color="secondary" />
                                            )}
                                            {product.isBestSeller === 1 && (
                                                <Chip label="BESTSELLER" size="small" color="primary" />
                                            )}
                                        </Box>
                                    </TableCell>
                                    {!isMobile && (
                                        <TableCell>
                                            <Chip
                                                label={`${product.images.length} image(s)`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => openEditDialog(product)}
                                                color="primary"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(product.id, product.name)}
                                                color="error"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
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
                    count={filteredProducts.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            {/* Add Product Dialog */}
            <Dialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '90vh' }
                }}
            >        <DialogTitle>
                    Add New Product
                    <IconButton
                        onClick={() => setIsAddDialogOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Add a new product to the jewelry collection
                    </Typography>

                    <Box component="form" onSubmit={(e) => handleSubmit(e, false)} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Product Name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    placeholder="Enter product name"
                                    required
                                    variant="outlined"
                                />

                                <TextField
                                    fullWidth
                                    label="Price"
                                    type="text"
                                    value={formData.price}
                                    onChange={handlePriceChange}
                                    placeholder="0.00"
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Stock Quantity"
                                    type="number"
                                    value={formData.stock}
                                    onChange={handleStockChange}
                                    placeholder="0"
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        inputProps: { min: 0 }
                                    }}
                                    helperText="Enter the number of items available in stock"
                                />

                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="Category"
                                        onChange={handleCategoryChange}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.id} value={category.slug}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Enter product description"
                                    required
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Product Images
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {imageUrls.map((url, index) => (
                                            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <TextField
                                                        fullWidth
                                                        value={url}
                                                        onChange={(e) => updateImageUrl(index, e.target.value)}
                                                        placeholder="Enter image URL or upload file"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                    {imageUrls.length > 1 && (
                                                        <IconButton
                                                            onClick={() => removeImageUrl(index)}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Button
                                                        variant="outlined"
                                                        component="label"
                                                        size="small"
                                                        startIcon={<Upload />}
                                                        sx={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Upload File
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, index)}
                                                        />
                                                    </Button>
                                                    {url && (
                                                        <Box
                                                            component="img"
                                                            src={url}
                                                            alt="Preview"
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                objectFit: 'cover',
                                                                borderRadius: 1,
                                                                border: '1px solid',
                                                                borderColor: 'divider'
                                                            }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                        <Button
                                            variant="outlined"
                                            onClick={addImageUrl}
                                            startIcon={<Add />}
                                            fullWidth
                                        >
                                            Add Another Image
                                        </Button>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Product Badges
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.isNewArrival}
                                                        onChange={(e) => handleCheckboxChange('isNewArrival', e.target.checked)}
                                                    />
                                                }
                                                label="New Arrival"
                                            />
                                            <Chip label="NEW" size="small" color="secondary" />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.isBestSeller}
                                                        onChange={(e) => handleCheckboxChange('isBestSeller', e.target.checked)}
                                                    />
                                                }
                                                label="Best Seller"
                                            />
                                            <Chip label="BESTSELLER" size="small" color="primary" />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    resetForm();
                                    setIsAddDialogOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                                startIcon={
                                    isSubmitting ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <Upload />
                                    )
                                }
                                sx={{ minWidth: 140 }}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Product'}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '90vh' }
                }}
            >        <DialogTitle>
                    Edit Product
                    <IconButton
                        onClick={() => setIsEditDialogOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Update product information
                    </Typography>

                    <Box component="form" onSubmit={(e) => handleSubmit(e, true)} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Product Name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    placeholder="Enter product name"
                                    required
                                    variant="outlined"
                                />

                                <TextField
                                    fullWidth
                                    label="Price"
                                    type="text"
                                    value={formData.price}
                                    onChange={handlePriceChange}
                                    placeholder="0.00"
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Stock Quantity"
                                    type="number"
                                    value={formData.stock}
                                    onChange={handleStockChange}
                                    placeholder="0"
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        inputProps: { min: 0 }
                                    }}
                                    helperText="Enter the number of items available in stock"
                                />

                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="Category"
                                        onChange={handleCategoryChange}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.id} value={category.slug}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Enter product description"
                                    required
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Product Images
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {imageUrls.map((url, index) => (
                                            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <TextField
                                                        fullWidth
                                                        value={url}
                                                        onChange={(e) => updateImageUrl(index, e.target.value)}
                                                        placeholder="Enter image URL or upload file"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                    {imageUrls.length > 1 && (
                                                        <IconButton
                                                            onClick={() => removeImageUrl(index)}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Button
                                                        variant="outlined"
                                                        component="label"
                                                        size="small"
                                                        startIcon={<Upload />}
                                                        sx={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Upload File
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, index)}
                                                        />
                                                    </Button>
                                                    {url && (
                                                        <Box
                                                            component="img"
                                                            src={url}
                                                            alt="Preview"
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                objectFit: 'cover',
                                                                borderRadius: 1,
                                                                border: '1px solid',
                                                                borderColor: 'divider'
                                                            }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                        <Button
                                            variant="outlined"
                                            onClick={addImageUrl}
                                            startIcon={<Add />}
                                            fullWidth
                                        >
                                            Add Another Image
                                        </Button>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Product Badges
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.isNewArrival}
                                                        onChange={(e) => handleCheckboxChange('isNewArrival', e.target.checked)}
                                                    />
                                                }
                                                label="New Arrival"
                                            />
                                            <Chip label="NEW" size="small" color="secondary" />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.isBestSeller}
                                                        onChange={(e) => handleCheckboxChange('isBestSeller', e.target.checked)}
                                                    />
                                                }
                                                label="Best Seller"
                                            />
                                            <Chip label="BESTSELLER" size="small" color="primary" />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    resetForm();
                                    setIsEditDialogOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                                startIcon={
                                    isSubmitting ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <Upload />
                                    )
                                }
                                sx={{ minWidth: 140 }}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Product'}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
