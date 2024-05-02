import axios from 'axios'
import React, { useState } from 'react'

import { api } from '../config'
import { Toast } from './ExcelManipulation/Utils'
// import * as Yup from 'yup'; // Importa Yup para la validación

const apiUrl = api()

const PasswordGeneratorForm: React.FC = () => {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const code = urlParams.get('code')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // Define el esquema de validación del formulario con Yup
  // const validationSchema = Yup.object().shape({
  //   confirmPassword: Yup.string().required('La contraseña es obligatoria'),
  //   password: Yup.string().required('La contraseña es obligatoria'),
  // });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password === formData.confirmPassword) {
      const response = await axios.put(
        `${apiUrl}/auth/new-password/?code=${code}`,
        {
          password: formData.password
        }
      )
      if (response.status == 200) {
        window.location.href = '/login'
      }
    } else {
      Toast.fire('Las contraseñas no coinciden', '', 'error')
    }
  }

  return (
    <div className='flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen pt:mt-0 dark:bg-gray-900'>
      <div className='w-full max-w-xl p-6 space-y-8 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800'>
        <h2 className='text-2xl font-semibold mb-4'>Generar Contraseña</h2>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor='password'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              Contraseña
            </label>
            <input
              type='password'
              id='password'
              name='password'
              className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor='confirmPassword'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              Confirmar Contraseña
            </label>
            <input
              type='password'
              id='confirmPassword'
              name='confirmPassword'
              className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type='submit'
            className='w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

export default PasswordGeneratorForm
