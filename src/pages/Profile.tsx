import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Typography, IconButton, TextField, Button } from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import { api } from "../config";
import PDFViewer from "../Components/PDFViewer";
import IMGViewer from "../Components/IMGViewer";
import toast, { Toaster } from "react-hot-toast";

interface Profile {
  id: number;
  name: string;
  profession: string;
  description: string;
  avatarUrl: string;
  cvUrl: string;
}

const apiUrl = api();

const Profile: React.FC = () => {
  const { id: idProfile } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [image, setImage] = useState<string>("");
  const [selectedCV, setSelectedCV] = useState<File | undefined>(undefined);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/profiles/${idProfile}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const { cvUrl, avatarUrl, createdAt, updatedAt, id, ...profileData } =
          response.data;

        setProfile(response.data);
        setEditedProfile(profileData);
        setImage(response.data.avatarUrl);
        setSelectedCV(response.data.cvUrl);
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      }
    };

    fetchProfile();
  }, [idProfile]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      await axios.put(`${apiUrl}/profiles/${idProfile}`, editedProfile, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Perfil actualizado con éxito");
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditedProfile((prevState: Profile | null) => ({
      ...prevState!,
      [name]: value,
    }));
  };

  const handleCVChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    // setSelectedCV(file);
    const formData = new FormData();
    formData.append("cv", file as Blob);
    try {
      // Enviar la imagen al backend Express
      const response = await axios.post(
        `${apiUrl}/profiles/${idProfile}/cv`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      console.log("Respuesta del backend:", response.data);
      setSelectedCV(response.data.profile.cvUrl);
      toast.success("Hoja de Vida actualizada con éxito");

      // Actualizar la imagen en el estado local
    } catch (error) {
      console.error("Error al enviar la imagen al backend:", error);
    }
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("avatar", file as Blob);

      try {
        // Enviar la imagen al backend Express
        const response = await axios.post(
          `${apiUrl}/profiles/${idProfile}/avatar`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        console.log("Respuesta del backend:", response.data);
        setImage(response.data.profile.avatarUrl);
        toast.success("Imagen actualizada con éxito");

        // Actualizar la imagen en el estado local
      } catch (error) {
        console.error("Error al enviar la imagen al backend:", error);
      }
    }
  };

  if (!profile) {
    return <Typography>Cargando perfil...</Typography>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <div>
          {isEditing ? (
            <TextField
              name="name"
              label="Nombre"
              value={editedProfile?.name || ""}
              onChange={handleInputChange}
              sx={{ mb: 2, width: "400px" }}
            />
          ) : (
            <Typography variant="h4" gutterBottom>
              {profile.name}
            </Typography>
          )}
          <Typography variant="h5" color="textSecondary" gutterBottom>
            {isEditing ? (
              <TextField
                name="profession"
                label="Profesión"
                value={editedProfile?.profession || ""}
                onChange={handleInputChange}
                sx={{ mb: 2, width: "400px" }}
              />
            ) : (
              profile.profession
            )}
          </Typography>
        </div>
        {!isEditing && (
          <IconButton
            color="primary"
            aria-label="Editar"
            component="span"
            onClick={handleEditClick}
          >
            <Edit />
          </IconButton>
        )}
        {isEditing && (
          <IconButton
            color="primary"
            aria-label="Guardar"
            component="span"
            onClick={handleSaveClick}
          >
            <Save />
          </IconButton>
        )}
      </div>
      <div className="md:flex md:items-center md:justify-center md:w-3/4 mb-10">
        <div
          className=""
          onClick={() => document.getElementById("avatarInput")?.click()}
        >
          <IMGViewer bucket="images" path={image} />
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>
        <div className="md:pl-8">
          <Typography variant="body1" gutterBottom>
            {isEditing ? (
              <TextField
                name="description"
                label="Descripción"
                multiline
                rows={4}
                sx={{ width: "600px" }}
                value={editedProfile?.description || ""}
                onChange={handleInputChange}
              />
            ) : (
              profile.description
            )}
          </Typography>
        </div>
      </div>
      <Button
        variant="outlined"
        sx={{
          mb: 4,
          marginLeft: "auto",
          marginRight: "auto",
          display: "block",
        }}
        onClick={() => document.getElementById("cvInput")?.click()}
      >
        Actualizar CV
      </Button>
      <input
        id="cvInput"
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleCVChange}
      />
      {/* @ts-ignore */}
      <PDFViewer bucket="cvs" path={selectedCV} view="default" />
    </div>
  );
};

export default Profile;
