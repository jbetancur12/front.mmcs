import React from 'react';

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    // Borra el token del localStorage
    localStorage.removeItem('accessToken');

    // Redirige al usuario a la página de inicio de sesión
    window.location.href = '/login'; // Cambia '/login' por la ruta de tu página de inicio de sesión
  };

  return (
    <a href='#' onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"> Cerrar Sesión</a>
  );
};

export default LogoutButton;
