import { Box } from '@mui/material';
import ErrorImage from './404Image.png'
import { GTAppBar } from 'src/components/AppBar';

const ErrorPage = () => {

    return (
        <Box 
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                textAlign: "center"
            }}
        >
            <GTAppBar withMenu={false} />
            <img src={ErrorImage} alt="404 Error" style={{ width: '50vw' }} />
        </Box>
    );
    
}

export default ErrorPage;