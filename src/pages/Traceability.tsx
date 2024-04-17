import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { api } from "../config.js";
import { CloudUpload } from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";

interface Traceability {
  id: number;
  name: string;
  createdAt: string;
}

const apiUrl = api();

const initialState = {
  name: "",
  file: null as File | null,
};

const Traceability = () => {
  const [traceabilities, setTraceabilities] = useState<Traceability[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/traceabilities`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setTraceabilities(response.data);
      } catch (error) {
        console.error("Error al cargar los perfiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setFormData({
          ...formData,
          file,
        });
      }
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("file", formData.file as Blob);

    try {
      const response = await axios.post(
        `${apiUrl}/traceabilities`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      toast.success("Trazabilidad creada con éxito");
      setTraceabilities([...traceabilities, response.data]);
      handleCloseModal();
    } catch (error) {
      console.error("Error al crear la trazabilidad:", error);
    }
  };

  const filteredTraceabilities = traceabilities.filter((traceability) =>
    traceability.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Toaster />
      <Typography variant="h6" gutterBottom>
        Trazabilidades
      </Typography>
      <TextField
        label="Buscar Trazabilidad"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleOpenModal}>
        Crear Trazabilidad
      </Button>
      <List>
        {filteredTraceabilities.map((traceability, index) => (
          <div key={index}>
            <ListItem
              disablePadding
              sx={{
                display: "flex",
                justifyContent: "space-between",

                mt: 2,
                mb: 2,
              }}
            >
              <ListItemText primary={traceability.name} />
              <div className="flex gap-4">
                <Button variant="contained" color="primary">
                  Descargar
                </Button>
                <Button variant="contained" color="primary">
                  Actualizar PDF
                </Button>
                <Button variant="contained" color="error">
                  Eliminar
                </Button>
              </div>
            </ListItem>
            <Divider />
          </div>
        ))}
      </List>
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Crear Nueva Trazabilidad</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 4 }}
          />
          <Button variant="outlined" sx={{ mb: 4 }}>
            <input
              type="file"
              accept=".pdf"
              id="file"
              name="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file" className="flex items-center cursor-pointer">
              <CloudUpload sx={{ mr: 1 }} />
              <span>Subir PDF</span>
            </label>
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Traceability;
