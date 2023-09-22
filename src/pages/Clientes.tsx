import React from "react";
import Table from '../Components/TableUsers';


const Users: React.FC = () => {

  return (
    <>

      <div className='flex flex-col'>
        <div className='overflow-x-auto'>
          <div className='inline-block min-w-full align-middle'>
            <div className='overflow-hidden shadow'>
              <Table />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Users;
