import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Button,
} from "@mui/material";
import { api } from "../config";
import { ArrowBack } from "@mui/icons-material";
import { format } from "date-fns";

const apiUrl = api();

interface Product {
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: number;
  nombre: string;
}

interface QuoteData {
  id: number;
  customerId: number;
  products: Product[];
  subtotal: number;
  discountRatio: number;
  total: number;
  taxRatio: number;
  taxTotal: number;
  discountTotal: number;
  observations: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

const Quote = () => {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Regresa a la página anterior en el historial de navegación
  };

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await axios.get<QuoteData>(`${apiUrl}/quotes/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.statusText === "OK") {
          setQuoteData(response.data);
        }
      } catch (error) {
        console.error("Error fetching quote data:", error);
      }
    };

    fetchQuote();
  }, [id]);

  if (!quoteData) return <div>Loading...</div>;

  return (
    <Box p={4}>
      <Button
        variant="contained"
        onClick={handleGoBack}
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      />
      <Typography variant="h4" mb={2}>
        <span style={{ color: "#ff5722" }}>Cotización #{quoteData.id}</span>
      </Typography>
      <Typography variant="subtitle1">
        <span style={{ fontWeight: "bold" }}>Fecha:</span>{" "}
        {format(new Date(quoteData.createdAt), "yyyy-MM-dd")}
      </Typography>
      <Typography variant="subtitle1">
        <span style={{ fontWeight: "bold" }}>Cliente:</span>{" "}
        {quoteData.customer.nombre}
      </Typography>
      <Typography variant="h6" mt={4}>
        <span style={{ color: "#ff5722" }}>Productos y/o Servicios:</span>
      </Typography>
      <TableContainer component={Paper} mt={2}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#f5f5f5" }}>
              <TableCell style={{ fontWeight: "bold" }}>Nombre</TableCell>
              <TableCell align="right" style={{ fontWeight: "bold" }}>
                Precio
              </TableCell>
              <TableCell align="right" style={{ fontWeight: "bold" }}>
                Cantidad
              </TableCell>
              <TableCell align="right" style={{ fontWeight: "bold" }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quoteData.products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">
                  $
                  {product.price.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell align="right">{product.quantity}</TableCell>
                <TableCell align="right">
                  $
                  {(product.price * product.quantity).toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="subtitle1" mt={4}>
        <span style={{ fontWeight: "bold" }}>Resumen:</span>
      </Typography>
      <Typography variant="body1">
        <span style={{ fontWeight: "bold" }}>Subtotal:</span> $
        {quoteData.subtotal.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })}
      </Typography>
      <Typography variant="body1">
        <span style={{ fontWeight: "bold" }}>Descuento:</span>{" "}
        {quoteData.discountRatio}% ($
        {quoteData.discountTotal.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })}
        )
      </Typography>
      <Typography variant="body1">
        <span style={{ fontWeight: "bold" }}>IVA:</span> {quoteData.taxRatio}%
        ($
        {quoteData.taxTotal.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })}
        )
      </Typography>
      <Typography variant="h6">
        <span style={{ color: "#ff5722", fontWeight: "bold" }}>Total:</span> $
        {quoteData.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
      </Typography>
      <Typography variant="body1" mt={2}>
        <span style={{ fontWeight: "bold" }}>Observaciones:</span>{" "}
        {quoteData.observations}
      </Typography>
    </Box>
  );
};

export default Quote;
