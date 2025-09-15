import { useState, useEffect } from 'react';

function Disciplinas() {
  useEffect(() => {
    document.title = 'Disciplinas - Radegondes';
  }, []);

  return (
    <>
      <header className='flex flex-col head'>
        <h1>Disciplinas</h1>
      </header>
    </>
  );
}

export default Disciplinas;
