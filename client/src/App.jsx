import { RouterProvider } from 'react-router-dom';

// routing (ubah menjadi path relatif ./routes)
import router from './routes';

// project imports (ubah menjadi path relatif ./layout dan ./themes)
import NavigationScroll from './layout/NavigationScroll';
import ThemeCustomization from './themes';

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <NavigationScroll>
        <>
          <RouterProvider router={router} />
        </>
      </NavigationScroll>
    </ThemeCustomization>
  );
}