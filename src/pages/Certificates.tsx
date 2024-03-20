import { useParams } from "react-router-dom";
import { api } from "../config";
import axios from "axios";
import { useEffect, useState } from "react";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import CertificatesList from "../Components/CertificatesList";
import UpdateCertificateModal from "../Components/UpdateCertificateModal";
import { userStore } from "../store/userStore";
import { useStore } from "@nanostores/react";

const apiUrl = api();

interface DeviceDetailsProps {
  id: number;
  name: string;
  city: string;
  location: string;
  sede: string;
  activoFijo: string;
  serie: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  filePath: string;
  customerId: number;
  deviceId: number;
  device: any;
  customer: any;
  certificateTypeId: number;
  createdAt: string;
  updatedAt: string;
}

function Certificates() {
  const { id } = useParams<{ id: string }>();
  const $userStore = useStore(userStore);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certificateData, setCertificateData] =
    useState<DeviceDetailsProps | null>(null);

  const getCertificateInfo = async () => {
    const response = await axios.get(`${apiUrl}/files/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (response.status === 200) {
      setCertificateData(response.data);
    }
  };

  useEffect(() => {
    getCertificateInfo();
  }, [id]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Paper elevation={3} className="p-4">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" gutterBottom>
          Detalles del Certificado
        </Typography>
        {$userStore.rol == "admin" && (
          <Button variant="contained" color="primary" onClick={handleOpenModal}>
            Actualizar Certificado
          </Button>
        )}
      </Box>
      <Divider className="mb-4" />
      {certificateData && (
        <>
          <Typography>
            <strong>Compañia:</strong> {certificateData.customer.nombre}
          </Typography>
          <Typography>
            <strong>Equipo:</strong> {certificateData.device.name}
          </Typography>
          <Typography>
            <strong>Ciudad:</strong> {certificateData.city}
          </Typography>
          <Typography>
            <strong>Ubicación:</strong> {certificateData.location}
          </Typography>
          <Typography>
            <strong>Sede:</strong> {certificateData.sede}
          </Typography>
          <Typography>
            <strong>Activo Fijo:</strong> {certificateData.activoFijo}
          </Typography>
          <Typography>
            <strong>Serie:</strong> {certificateData.serie}
          </Typography>
          <Typography>
            <strong>Ultima Fecha de Calibración:</strong>{" "}
            {new Date(certificateData.calibrationDate).toLocaleDateString()}
          </Typography>
          <Typography>
            <strong>Próxima Fecha de Calibración:</strong>{" "}
            {new Date(certificateData.nextCalibrationDate).toLocaleDateString()}
          </Typography>
        </>
      )}
      <Divider className="mb-4" />
      <UpdateCertificateModal
        open={isModalOpen}
        onClose={handleCloseModal}
        id={id}
      />
      <CertificatesList />
    </Paper>
  );
}

export default Certificates;
