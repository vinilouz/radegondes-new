import { useState, useEffect } from 'react';

function Planejamentos() {
  useEffect(() => {
    document.title = 'Planejamentos - Radegondes';
  }, []);

  return (
    <>
      <header className='flex flex-col'>
        <h1>Planejamentos</h1>
      </header>
    </>
  );
}

export default Planejamentos;
