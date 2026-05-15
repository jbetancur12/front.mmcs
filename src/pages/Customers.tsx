import React from 'react'
import CustomersTable from './CustomersTable'
// import CustomersCards from './CustomersCards'

/**
 * Customers Component - Main Entry Point
 * 
 * This component provides two different views for the customers page:
 * 
 * 1. CustomersTable (DEFAULT) - Modern table view using MaterialReactTable
 *    - Advanced search and filtering
 *    - Sortable columns
 *    - Pagination
 *    - Compact data display
 * 
 * 2. CustomersCards - Modern card-based view
 *    - Visual card layout
 *    - Debounced search
 *    - Responsive grid
 *    - Better for visual browsing
 * 
 * To switch to the card view, uncomment the import above and change the return statement to:
 * return <CustomersCards />
 */
const Customers: React.FC = () => {
  return <CustomersTable />
  // return <CustomersCards />  // Uncomment this line to use card view
}

export default Customers
