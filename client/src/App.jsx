import { RouterProvider } from 'react-router-dom';
import router from './routes';
import NavigationScroll from './layout/NavigationScroll';
import ThemeCustomization from './themes';
import { ConfigProvider } from './contexts/ConfigContext';

export default function App() {
  return (
    <ConfigProvider>
      <ThemeCustomization>
        <NavigationScroll>
          <RouterProvider router={router} />
        </NavigationScroll>
      </ThemeCustomization>
    </ConfigProvider>
  );
}