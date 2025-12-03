import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Paper,
    Grid,
    Avatar,
    Alert,
    AlertTitle,
    useMediaQuery,
    useTheme,
    Divider,
    Chip, // 👈 Nuevo: para el badge
    CircularProgress // 👈 Nuevo: para el estado de carga
} from '@mui/material';
import {
    AttachMoney,
    Close,
    Receipt, // 👈 Nuevo ícono para facturar
} from '@mui/icons-material';
// Asegúrate de que esta importación sea correcta en tu entorno:
import { formatCurrency } from 'src/pages/maintenance/MaintenanceTicketDetails'; 

// --- Interfaces ---

interface Cost {
    name: string;
    description?: string;
    // Permitimos number o string, pero aseguramos que se parsea en el cálculo
    amount: number | string; 
}

interface CostsListDialogProps {
    open: boolean;
    onClose: () => void;
    costs?: Cost[];
    // 1. Añadimos el estado de facturación como prop inicial
    isInitiallyInvoiced: boolean; 
    // 2. Añadimos el manejador para la acción de facturar
    onInvoice: () => Promise<void>; 
    isProcessingInvoice: boolean; // Estado de carga para la acción de facturar
}

// --- Componente Principal ---

const CostsListDialog: React.FC<CostsListDialogProps> = ({
    open,
    onClose,
    costs: initialCosts = [],
    isInitiallyInvoiced,
    onInvoice,
    isProcessingInvoice
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // 👈 Estado interno para manejar si se ha facturado (inicializado con la prop)
    const [isInvoiced, setIsInvoiced] = useState(isInitiallyInvoiced); 
    
    // Sincronización del estado si la prop inicial cambia (ej. si el padre resetea el ticket)
    useMemo(() => {
        setIsInvoiced(isInitiallyInvoiced);
    }, [isInitiallyInvoiced]);


    // Cálculo del total
    const totalCost = useMemo(() => {
        return initialCosts.reduce((sum, cost) => sum + parseFloat(cost.amount.toString() || '0'), 0);
    }, [initialCosts]);

    // Manejador del botón de facturación
    const handleInvoice = async () => {
        try {
            await onInvoice();
            // 3. Una vez que la acción del padre es exitosa, actualizamos el estado interno
            setIsInvoiced(true); 
            // Opcional: podrías cerrar el diálogo aquí, o dejarlo abierto.
            // onClose(); 
        } catch (error) {
            console.error("Error al facturar el ticket:", error);
            // El componente padre debe manejar el error y mostrar una notificación al usuario
        }
    };
    
    // --- Renderizado del Componente ---

    // Determinar el color y texto del Chip de estado
    const statusChip = useMemo(() => {
        if (isInvoiced) {
            return (
                <Chip 
                    label="Facturado" 
                    color="success" 
                    icon={<Receipt />} 
                    size="small"
                />
            );
        }
        return (
            <Chip 
                label="No Facturado" 
                color="warning" 
                icon={<AttachMoney />} 
                size="small"
            />
        );
    }, [isInvoiced]);


    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 1 }} />
                        <Typography variant="h6">Costo del Servicio</Typography>
                        <Box ml={2}>{statusChip}</Box> {/* 👈 Colocamos el Chip aquí */}
                    </Box>
                    <IconButton onClick={onClose} disabled={isProcessingInvoice}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                {initialCosts.length === 0 ? (
                    <Alert severity="info">
                        <AlertTitle>No hay Costos Registrados</AlertTitle>
                        No hay costos asociados a este ticket de mantenimiento.
                    </Alert>
                ) : (
                    <>
                        {/* Lista de Costos */}
                        {initialCosts.map((cost, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    background: '#fafafa',
                                    '&:hover': {
                                        background: '#f0fdf4',
                                        borderColor: '#10b981'
                                    },
                                    '&:last-child': { mb: 0 }
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    {/* Index */}
                                    <Grid item xs="auto">
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                fontSize: '0.875rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            {index + 1}
                                        </Avatar>
                                    </Grid>

                                    {/* Name & Description */}
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" fontWeight={600}>
                                            {cost.name}
                                        </Typography>
                                        {cost.description && (
                                            <Typography variant="caption" color="text.secondary">
                                                {cost.description}
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Amount */}
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Monto
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="#059669">
                                            {formatCurrency(parseFloat(cost.amount.toString()))}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}

                        <Divider sx={{ my: 2 }} />
                        
                        {/* Resumen Total */}
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{
                                p: 2,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
                            }}
                        >
                            <Typography variant="h6" fontWeight={600}>
                                Total de Costos
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color="#059669">
                                {formatCurrency(totalCost)}
                            </Typography>
                        </Box>
                    </>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Button onClick={onClose} color="inherit" disabled={isProcessingInvoice}>
                    Cerrar
                </Button>
                {/* 👈 Botón de Facturar */}
                <Button
                    onClick={handleInvoice}
                    color="primary"
                    variant="contained"
                    disabled={isInvoiced || initialCosts.length === 0 || isProcessingInvoice}
                    startIcon={
                        isProcessingInvoice ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <Receipt />
                        )
                    }
                >
                    {isProcessingInvoice
                        ? 'Facturando...'
                        : isInvoiced
                        ? 'Ya Facturado'
                        : 'Facturar Costos'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CostsListDialog;