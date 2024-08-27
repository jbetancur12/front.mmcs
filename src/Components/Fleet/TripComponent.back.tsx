// import React, { useState } from 'react'
// import {
//   Button,
//   Card,
//   CardActions,
//   CardContent,
//   Typography
// } from '@mui/material'
// import { Trip } from './types'
// import InspectionComponent from './InspectionComponent'

// const TripComponent: React.FC<{ trip: Trip }> = ({ trip }) => {
//   const [inspectionOpen, setInspectionOpen] = useState<boolean>(false)

//   const handleStartInspection = () => {
//     setInspectionOpen(true)
//   }

//   const handleCompleteInspection = () => {
//     setInspectionOpen(false)
//     // Lógica para marcar el viaje como completado
//   }

//   return (
//     <Card>
//       <CardContent>
//         <Typography variant='h6'>{`Trip #${trip.id}`}</Typography>
//         <Typography>{`Driver: ${trip.driver}`}</Typography>
//         <Typography>{`Start Date: ${trip.startDate}`}</Typography>
//         <Typography>{`Status: ${trip.tripStatus}`}</Typography>
//       </CardContent>
//       <CardActions>
//         {trip.tripStatus === 'Planned' && (
//           <Button variant='contained' onClick={handleStartInspection}>
//             Start Trip
//           </Button>
//         )}
//         {trip.tripStatus === 'Ongoing' && (
//           <Button variant='contained' onClick={handleCompleteInspection}>
//             Complete Trip
//           </Button>
//         )}
//       </CardActions>

//       <InspectionComponent
//         //open={inspectionOpen}
//         //onClose={() => setInspectionOpen(false)}
//         tripId={trip.id}
//         vehicleId={trip.vehicleId}
//         inspectionType={trip.tripStatus === 'Planned' ? 'Start' : 'End'}
//       />
//     </Card>
//   )
// }

// export default TripComponent
