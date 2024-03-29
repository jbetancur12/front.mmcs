import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AutoComplete from "./AutoComplete";
import { api } from "../config";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";

const apiUrl = api();

interface Product {
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
}
interface QuoteFormData {
  id?: number; // Agregamos el signo de interrogación para indicar que el ID es opcional
  customer: Customer | null;
  products: Product[];
  discountRatio: number;
  taxRatio: number;
  observations: string;
}

const QuoteForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([
    { name: "", price: 0, quantity: 1 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(19);
  const [observations, setObservations] = useState("");

  const fetchQuote = async () => {
    try {
      const response = await axios.get<QuoteFormData>(
        `${apiUrl}/quotes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.statusText === "OK") {
        setCustomer(response.data.customer);
        setProducts(response.data.products);
        setDiscount(response.data.discountRatio);
        setTaxRate(response.data.taxRatio);
        setObservations(response.data.observations);
      }
    } catch (error) {
      console.error("Error fetching quote data:", error);
    }
  };

  useEffect(() => {
    if (id) {
      // Si hay un ID en los parámetros de la URL, significa que estamos editando
      fetchQuote();
    }
  }, []);

  const handleProductChange = (
    index: number,
    field: string,
    value: string | number | Product
  ) => {
    const updatedProducts = products.map((product, idx) => {
      if (idx === index && field !== "product") {
        return {
          ...product,
          [field]: value,
        };
      } else if (idx === index && field === "product") {
        const { name, price } = value as Product;
        return {
          ...product,
          name: name,
          price: price,
        };
      } else {
        return product;
      }
    });

    setProducts(updatedProducts);
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: "", price: 0, quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);
  };

  const subtotal = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  );
  const tax = subtotal * 0.16;
  const discountAmount = subtotal * (discount / 100); // Calcula el monto del descuento
  const total = subtotal + tax - discountAmount; // Aplica el descuento al total

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const requestConfig = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      };

      const requestData = {
        customerId: customer?.id,
        products,
        taxRatio: taxRate,
        discountRatio: discount,
        observations,
      };

      let response;
      let actionMessage;

      if (!!id) {
        response = await axios.put(
          `${apiUrl}/quotes/${id}`,
          requestData,
          requestConfig
        );
        actionMessage = "modificada";
      } else {
        response = await axios.post(
          `${apiUrl}/quotes`,
          requestData,
          requestConfig
        );
        actionMessage = "creada";
      }

      if (response.statusText === "OK") {
        toast.success(`Cotización ${actionMessage} Exitosamente!`, {
          duration: 4000,
          position: "top-center",
        });
      } else {
        console.error("Error al crear equipo");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <Box sx={{ margin: "auto" }}>
      <Toaster />
      <form onSubmit={handleSubmit}>
        <AutoComplete
          endpoint={`${apiUrl}/customers`}
          token={localStorage.getItem("accessToken")}
          label="Buscar Cliente"
          value={customer?.nombre}
          isEdit={!!id}
          mapOption={(data) =>
            data.map((item: any) => ({
              id: item.id,
              nombre: item.nombre,
            }))
          }
          getOptionLabel={(option: any) => option.nombre}
          onClientSelection={(customer) => setCustomer(customer)}
          sx={{ mb: 2, width: "400px" }}
        />

        {products.map((product, index) => (
          <div key={index} style={{ display: "flex", marginBottom: "8px" }}>
            <AutoComplete
              endpoint={`${apiUrl}/products`}
              token={localStorage.getItem("accessToken")}
              label="Producto"
              value={product?.name}
              isEdit={!!id}
              mapOption={(data) =>
                data.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                }))
              }
              getOptionLabel={(option: any) => option.name}
              onClientSelection={(product) => {
                handleProductChange(index, "product", product);
              }}
              sx={{ mr: 2, width: "100%" }}
            />

            <TextField
              label="Precio"
              variant="outlined"
              type="number"
              value={product.price}
              onChange={(e) =>
                handleProductChange(index, "price", parseFloat(e.target.value))
              }
              style={{ marginRight: "8px" }}
              sx={{ mr: 2, width: "100%" }}
            />
            <TextField
              label="Cantidad"
              variant="outlined"
              type="number"
              value={product.quantity}
              onChange={(e) =>
                handleProductChange(index, "quantity", parseInt(e.target.value))
              }
              style={{ marginRight: "8px" }}
              sx={{ mr: 2, width: "100%" }}
            />
            <Button
              variant="contained"
              color="error"
              onClick={() => handleRemoveProduct(index)}
              sx={{ mr: 2, width: "250px" }}
            >
              Eliminar
            </Button>
          </div>
        ))}
        <Button variant="contained" onClick={handleAddProduct} sx={{ mb: 2 }}>
          Agregar Producto
        </Button>
        <TextField
          label="Descuento (%)"
          variant="outlined"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="IVA (%)"
          variant="outlined"
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(parseInt(e.target.value))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Observaciones"
          variant="outlined"
          multiline
          rows={4}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Typography variant="subtitle1">
          Subtotal: $
          {subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
        </Typography>
        <Typography variant="subtitle1">
          IVA ({taxRate}%): $
          {tax.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
        </Typography>
        <Typography variant="subtitle1">
          Descuento: $
          {discountAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}{" "}
          ({discount}%)
        </Typography>
        <Typography variant="h6">
          Total: ${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
        </Typography>
        <Button type="submit" variant="contained" sx={{ mb: 2 }}>
          {!!id ? "Actualizar" : "Crear"}
        </Button>
      </form>
    </Box>
  );
};

export default QuoteForm;
