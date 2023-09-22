import React, { useEffect, useState } from "react";
import Modal from "react-modal";

interface UserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: { nombre: string; email: string, identificacion: string; contraseña: string }) => void;
}

const UserCreationModal: React.FC<UserCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateUser,
}) => {
  const initialFormData = { nombre: "", email: "", identificacion: "", contraseña: "" }
  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCreateUser = () => {
    onCreateUser(formData);
    onClose();
  };

  useEffect(() => {
    // Restablecer los campos cuando el modal se abre
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);



  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Crear Usuario"
      className="modal z-50"
      overlayClassName="modal-overlay"
      shouldCloseOnOverlayClick={true}
      ariaHideApp={false}
    >
      <div className="w-96 bg-white p-4 rounded-lg shadow-lg m-auto">
        <h2 className="text-lg font-semibold mb-4">Crear Usuario</h2>
        <form>
          <div className="mb-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="identificacion"
              placeholder="Identificacion"
              value={formData.identificacion}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="contraseña"
              placeholder="Contraseña"
              value={formData.contraseña}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UserCreationModal;
