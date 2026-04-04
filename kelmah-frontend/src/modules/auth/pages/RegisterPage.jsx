import Register from '../components/register/Register';
import MobileRegister from '../components/mobile/MobileRegister';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom } from '@/utils/safeArea';

const RegisterPage = () => {
  const isMobile = useBreakpointDown('md');

  const pageTitle = (
    <Helmet>
      <title>Sign Up | Kelmah</title>
    </Helmet>
  );

  if (isMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 2, md: 4 },
          pb: { xs: withSafeAreaBottom(20), md: 6 },
        }}
      >
        {pageTitle}
        <MobileRegister />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      {pageTitle}
      <Register />
    </PageCanvas>
  );
};

export default RegisterPage;
