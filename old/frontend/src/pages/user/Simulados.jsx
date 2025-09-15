import { useState, useEffect } from 'react';

function Simulados() {
  useEffect(() => {
    document.title = 'Simulados - Radegondes';
  }, []);

  return (
    <>
      <header className='flex flex-col'>
        <h1>Simulados</h1>
      </header>
    </>
  );
}

export default Simulados;
