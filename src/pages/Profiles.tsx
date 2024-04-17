import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../config";
import { List, ListItem, Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface Profile {
  id: number;
  name: string;
}

const apiUrl = api();

const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/profiles`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setProfiles(response.data);
      } catch (error) {
        console.error("Error al cargar los perfiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div>
      <Typography variant="h2" align="center" gutterBottom>
        Listado de Perfiles
      </Typography>
      <div className="max-w-xl ">
        <List>
          {profiles.map((profile) => (
            <ListItem
              key={profile.id}
              className="border border-gray-200 rounded-lg mb-4 p-4 shadow-md"
            >
              <Link
                to={`${profile.id}`}
                className="text-blue-500 hover:underline"
              >
                <Typography variant="h4">{profile.name}</Typography>
              </Link>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
};

export default Profiles;
