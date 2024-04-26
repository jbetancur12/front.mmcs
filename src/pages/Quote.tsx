import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Box, Button } from "@mui/material";
import { api } from "../config";
import { ArrowBack } from "@mui/icons-material";

import QuotePDFGenerator from "../Components/QuotePDFGenerator";
import { QuoteData } from "../Components/TableQuotes";

const apiUrl = api();

// interface Product {
//   name: string;
//   price: number;
//   quantity: number;
// }

// interface Customer {
//   id: number;
//   nombre: string;
//   email: string;
//   telefono: string;
//   direccion: string;
//   ciudad: string;
// }

// export interface QuoteData {
//   id: number;
//   customerId: number;
//   products: Product[];
//   subtotal: number;
//   discountRatio: number;
//   total: number;
//   taxRatio: number;
//   taxTotal: number;
//   discountTotal: number;
//   observations: string;
//   createdAt: string;
//   updatedAt: string;
//   customer: Customer;
// }

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

      <QuotePDFGenerator quoteData={quoteData} />
    </Box>
  );
};

export default Quote;
