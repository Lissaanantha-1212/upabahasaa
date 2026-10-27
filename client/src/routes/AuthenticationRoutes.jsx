import { lazy } from 'react';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';


// maintenance routing
const JadwalTest = Loadable(lazy(() => import('views/pages/jadwal-test/index')));
const JadwalKursus = Loadable(lazy(() => import('views/pages/jadwal-kursus/index')));
const JadwalRemedial = Loadable(lazy(() => import('views/pages/jadwal-remedial/index')));

const HasilTestTOEFL = Loadable(lazy(() => import('views/pages/hasil-test/toefl')));
const HasilTestSSPECT = Loadable(lazy(() => import('views/pages/hasil-test/sspect')));
const HasilTestTOEIC = Loadable(lazy(() => import('views/pages/hasil-test/toeic')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: '/pages/jadwal-test',
      element: <JadwalTest />
    },
    {
      path: '/pages/jadwal-kursus',
      element: <JadwalKursus />
    },
    {
      path: '/pages/jadwal-remedial',
      element: <JadwalRemedial />
    },
    {
      path: '/pages/hasil-test/toefl',
      element: <HasilTestTOEFL />
    },
    {
      path: '/pages/hasil-test/sspect',
      element: <HasilTestSSPECT />
    },
    {
      path: '/pages/hasil-test/toeic',
      element: <HasilTestTOEIC />
    }
  ]
};

export default AuthenticationRoutes;
