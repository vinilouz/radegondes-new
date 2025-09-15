import { useState } from 'react';
import Sidebar from './Sidebar';
import PerfilModal from './PerfilModal';
import Breadcrumb from './Breadcrumb';

function MainLayout({ children, breadcrumbItems = null }) {
  const [showPerfilModal, setShowPerfilModal] = useState(false);

  const handleOpenPerfil = () => {
    console.log('Abrindo modal de perfil...');
    setShowPerfilModal(true);
  };

  return (
    <>
      <Sidebar onOpenPerfil={handleOpenPerfil} />
      <main className='main'>
        {breadcrumbItems && <Breadcrumb customItems={breadcrumbItems} />}
        {children}
      </main>
      
      <PerfilModal 
        isOpen={showPerfilModal} 
        onClose={() => setShowPerfilModal(false)} 
      />
    </>
  );
}

export default MainLayout;