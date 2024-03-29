import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TableUsersCustomer from "../Components/TableUsersCustomer";
import { api } from "../config";
import {
  Certificate,
  CertificateListItem,
} from "../Components/CertificateListItem";

// API URL
const apiUrl = api();
const minioUrl = import.meta.env.VITE_MINIO_URL;
// function CustomerDetail() {
//   const { id } = useParams();
//   const [customerData, setCustomerData] = useState({});
//   // Aquí puedes usar el valor de 'id' para cargar los detalles del cliente correspondiente
//   // por ejemplo, hacer una solicitud a la API o acceder a tus datos.

//   const getuserInfo = async () => {
//     const response = await axios.get(`${apiUrl}/customers/${id}`,{
//       headers: {
//         'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
//       }
//     })
//     if (response.status === 200) {
//       setCustomerData(response.data)
//     }

//   }

//   useEffect(() =>{
//     getuserInfo()
//   },[])

//   return (
//     <div>
//       <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
//             <h3 className="mb-4 text-xl font-semibold dark:text-white">{customerData.nombre}</h3>
//             <form action="#">
//                 <div className="grid grid-cols-6 gap-6">
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="first-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
//                         <input type="text" name="first-name" id="first-name" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Bonnie" required/>
//                     <div data-lastpass-icon-root="true" ></div></div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="last-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
//                         <input type="text" name="last-name" id="last-name" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Green" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="country" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
//                         <input type="text" name="country" id="country" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="United States" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="city" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">City</label>
//                         <input type="text" name="city" id="city" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="e.g. San Francisco" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address</label>
//                         <input type="text" name="address" id="address" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="e.g. CalihtmlFornia" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
//                         <input type="email" name="email" id="email" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="example@company.com" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="phone-number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone Number</label>
//                         <input type="number" name="phone-number" id="phone-number" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="e.g. +(12)3456 789" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="birthday" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Birthday</label>
//                         <input type="number" name="birthday" id="birthday" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="15/08/1990" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="organization" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Organization</label>
//                         <input type="text" name="organization" id="organization" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Company Name" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role</label>
//                         <input type="text" name="role" id="role" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="React Developer" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="department" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</label>
//                         <input type="text" name="department" id="department" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Development" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-span-3">
//                         <label htmlFor="zip-code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Zip/postal code</label>
//                         <input type="number" name="zip-code" id="zip-code" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="123456" required/>
//                     </div>
//                     <div className="col-span-6 sm:col-full">
//                         <button className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" type="submit">Save all</button>
//                     </div>
//                 </div>
//             </form>
//         </div>
//     </div>
//   );
// }

// export default CustomerDetail;

interface UserData {
  nombre: string;
  email: string;
  telefono: string;
  avatar?: string;
}

type Tab = "users" | "certificates";

function UserProfile() {
  const { id } = useParams();
  const [customerData, setCustomerData] = useState<UserData>({
    nombre: "",
    email: "",
    telefono: "",
    avatar: "",
  });

  const [activeTab, setActiveTab] = useState<Tab>("certificates");

  const [certificatesData, setCertificatesData] = useState<Certificate[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [image, setImage] = useState("/images/pngaaa.com-4811116.png");
  // Aquí puedes usar el valor de 'id' para cargar los detalles del cliente correspondiente
  // por ejemplo, hacer una solicitud a la API o acceder a tus datos.

  const getuserInfo = async () => {
    const response = await axios.get(`${apiUrl}/customers/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (response.status === 200) {
      setCustomerData(response.data);
      setImage(minioUrl + "/images/" + response.data.avatar);
    }
  };

  const getCertificateInfo = async () => {
    const response = await axios.get(`${apiUrl}/files/customer/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (response.status === 200) {
      setCertificatesData(response.data);
    }
  };

  const filteredCertificates = certificatesData.filter((certificate) => {
    const searchFields = [
      certificate.device.name,
      certificate.location,
      certificate.sede,
      certificate.activoFijo,
      certificate.serie,
    ];

    return searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newImage = event.target.files?.[0];
    // Aquí puedes implementar la lógica para cargar la imagen al servidor y actualizarla en la base de datos
    // También puedes utilizar librerías como axios para hacer la solicitud HTTP
    if (newImage) {
      setImage(URL.createObjectURL(newImage));
      const formData = new FormData();
      formData.append("file", newImage as Blob);
      formData.append(
        "customerId",
        id !== undefined && typeof id === "string" ? id : ""
      );

      try {
        // Enviar la imagen al backend Express
        const response = await axios.post(
          `${apiUrl}/customers/avatar`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        console.log("Respuesta del backend:", response.data);

        // Actualizar la imagen en el estado local
      } catch (error) {
        console.error("Error al enviar la imagen al backend:", error);
      }
    } else {
      setImage("/images/pngaaa.com-4811116.png");
    }
  };

  // const handleSaveImage = async () => {
  //   const formData = new FormData();
  //   formData.append("file", file as Blob);
  //   formData.append(
  //     "customerId",
  //     id !== undefined && typeof id === "string" ? id : ""
  //   );

  //   try {
  //     // Enviar la imagen al backend Express
  //     const response = await axios.post(`${apiUrl}/customers`, formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //       },
  //     });
  //     console.log("Respuesta del backend:", response.data);

  //     // Actualizar la imagen en el estado local
  //   } catch (error) {
  //     console.error("Error al enviar la imagen al backend:", error);
  //   }
  // };

  useEffect(() => {
    getuserInfo();
    getCertificateInfo();
  }, []);

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md mx-auto mt-4">
        <div className="text-center">
          <div className="flex flex-col justify-center">
            <label htmlFor="imageInput">
              <img
                src={image} // Reemplaza con la URL de la imagen del usuario
                alt={`${customerData.nombre}`}
                className="w-24 h-24 rounded-full mx-auto cursor-pointer"
              />
            </label>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {/* {file && (
              <button
                onClick={handleSaveImage}
                className="flex items-center justify-center self-center mt-3 w-fit px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:bg-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14 2h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m5-5l1.41-1.41a2 2 0 0 0 0-2.83L19.83 6A2 2 0 0 0 18 6V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1"
                  />
                </svg>
                <span>Guardar</span>
              </button>
            )} */}
          </div>
          <h2 className="text-2xl font-semibold mt-4">{customerData.nombre}</h2>
        </div>

        <div className="mt-6">
          {/* <h3 className="text-xl font-semibold">Información del usuario</h3> */}
          <ul className="mt-3">
            <li className="flex items-center text-gray-700">
              <svg
                className="h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 512 512"
              >
                <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
              </svg>
              {customerData.email}
            </li>
            <li className="flex items-center text-gray-700 mt-2">
              <svg
                className="h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 512 512"
              >
                <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z" />
              </svg>
              {customerData.telefono}
            </li>
          </ul>
        </div>
      </div>

      <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 mt-8">
        <li className="-mb-px mr-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("certificates");
            }}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
              activeTab === "certificates"
                ? "border-l border-t border-r rounded-t"
                : "text-blue-500 hover:text-blue-800"
            }`}
            // aria-current={activeTab === "certificates" ? "page" : undefined}
          >
            Equipos
          </a>
        </li>
        <li className="mr-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("users");
            }}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
              activeTab === "users"
                ? "border-l border-t border-r rounded-t"
                : "text-blue-500 hover:text-blue-800"
            }`}
          >
            Usuarios
          </a>
        </li>
      </ul>
      {activeTab === "certificates" && (
        <>
          <input
            type="text"
            placeholder="Buscar Equipo(s)..."
            className="w-[50%] px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mt-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredCertificates.map((certificate: Certificate) => (
            <CertificateListItem
              key={certificate.id}
              certificate={certificate}
            />
          ))}
        </>
      )}
      {activeTab === "users" && <TableUsersCustomer />}
    </>
  );
}

export default UserProfile;
