import { useState, useEffect } from 'react';

function Edital() {
  useEffect(() => {
    document.title = 'Edital - Radegondes';
  }, []);

  return (
    <>
      <header className='flex flex-col head'>
        <h1>Edital</h1>
      </header>
    </>
  );
}

export default Edital;
