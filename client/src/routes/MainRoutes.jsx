import { lazy } from 'react';
import Loadable from 'ui-component/Loadable';

// project imports
import MainLayout from 'layout/MainLayout';




// penjadwalan routing
const JadwalTestPage = Loadable(lazy(() => import('views/pages/jadwal-test')));
const JadwalRemedialPage = Loadable(lazy(() => import('views/pages/jadwal-remedial')));
const JadwalKursusPage = Loadable(lazy(() => import('views/pages/jadwal-kursus')));

// hasil test routing
const HasilTestTOEFLPage = Loadable(lazy(() => import('views/pages/hasil-test/toefl')));
const HasilTestSSPECTPage = Loadable(lazy(() => import('views/pages/hasil-test/sspect')));
const HasilTestTOEICPage = Loadable(lazy(() => import('views/pages/hasil-test/toeic')));

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: '/sample-page',
      element: <SamplePage />
    },
    {
      path: '/pages/jadwal-test',
      element: <JadwalTestPage />
    },
    {
      path: '/pages/jadwal-remedial',
      element: <JadwalRemedialPage />
    },
    {
      path: '/pages/jadwal-kursus',
      element: <JadwalKursusPage />
    },
    {
      path: '/pages/toefl',
      element: <HasilTestTOEFLPage />
    },
    {
      path: '/pages/sspect',
      element: <HasilTestSSPECTPage />
    },
    {
      path: '/pages/toeic',
      element: <HasilTestTOEICPage />
  }
  ]
};

export default MainRoutes;
