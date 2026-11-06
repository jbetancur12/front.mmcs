const NotFound = () => {
  return (
    <div className='h-screen w-screen bg-neutral-alt flex items-center'>
      <div className='container flex flex-col md:flex-row items-center justify-between px-5 text-neutral-body'>
        <div className='w-full lg:w-1/2 mx-8'>
          <div className='text-7xl text-intent-success font-dark font-extrabold mb-8'>
            {' '}
            404
          </div>
          <p className='text-2xl md:text-3xl font-light leading-normal mb-8'>
            Lo siento, no pudimos encontrar la página que estás buscando.
          </p>

          <a
            href='/'
            className='px-5 inline py-3 text-sm font-medium leading-5 shadow-2xl text-white transition-all duration-400 border border-transparent rounded-lg focus:outline-none bg-intent-success-ink active:bg-intent-danger hover:bg-intent-danger-ink'
          >
            Volver a la página de inicio.
          </a>
        </div>
        <div className='w-full lg:flex lg:justify-end lg:w-1/2 mx-5 my-12'>
          <img
            src='https://user-images.githubusercontent.com/43953425/166269493-acd08ccb-4df3-4474-95c7-ad1034d3c070.svg'
            className=''
            alt='Page not found'
          />
        </div>
      </div>
    </div>
  )
}

export default NotFound
